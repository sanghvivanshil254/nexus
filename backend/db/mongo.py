import hashlib
import time
import contextvars
import logging
from typing import Optional, Dict, Any, List
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError, ConnectionFailure

from backend.config import MONGO_URI, DB_NAME, CACHE_COLLECTION, JOBS_COLLECTION

logger = logging.getLogger("nexus.mongo")

guest_context_var = contextvars.ContextVar("guest_context_var", default=False)

class MongoDBManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBManager, cls).__new__(cls)
            cls._instance._init_db()
        return cls._instance

    def _init_db(self):
        self.client = None
        self.db = None
        self.cache_col = None
        self.jobs_col = None
        self.is_connected = False
        self._guest_jobs: Dict[str, Dict[str, Any]] = {}
        self._memory_jobs: Dict[str, Dict[str, Any]] = {}
        
        try:
            self.client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            # Trigger connection check
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.cache_col = self.db[CACHE_COLLECTION]
            self.jobs_col = self.db[JOBS_COLLECTION]
            self.is_connected = True
            
            # Setup indexes
            self.cache_col.create_index([("hash_key", ASCENDING)], unique=True)
            self.cache_col.create_index([("src_lang", ASCENDING), ("tgt_lang", ASCENDING)])
            self.jobs_col.create_index([("job_id", ASCENDING)], unique=True)
            
            logger.info("MongoDB connected successfully to %s, db=%s", MONGO_URI, DB_NAME)
        except (ConnectionFailure, PyMongoError) as e:
            logger.warning("MongoDB connection failed (%s). Operating in memory-only fallback mode.", e)
            self.is_connected = False

    @staticmethod
    def compute_hash(text: str, src_lang: str, tgt_lang: str, model: str) -> str:
        key = f"{model}:{src_lang}:{tgt_lang}:{text.strip()}"
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def get_cached_translation(self, text: str, src_lang: str, tgt_lang: str, model: str, is_guest: bool = False) -> Optional[str]:
        if is_guest or guest_context_var.get() or not self.is_connected or not text.strip():
            return None
        try:
            hash_key = self.compute_hash(text, src_lang, tgt_lang, model)
            doc = self.cache_col.find_one({"hash_key": hash_key})
            if doc and "translated_text" in doc:
                return doc["translated_text"]
        except Exception as e:
            logger.error("Error reading cache: %s", e)
        return None

    def set_cached_translation(self, text: str, translated_text: str, src_lang: str, tgt_lang: str, model: str, is_guest: bool = False):
        if is_guest or guest_context_var.get() or not self.is_connected or not text.strip():
            # Guest mode does not write to the database
            return
        try:
            hash_key = self.compute_hash(text, src_lang, tgt_lang, model)
            self.cache_col.update_one(
                {"hash_key": hash_key},
                {
                    "$set": {
                        "hash_key": hash_key,
                        "source_text": text,
                        "translated_text": translated_text,
                        "src_lang": src_lang,
                        "tgt_lang": tgt_lang,
                        "model": model,
                        "updated_at": time.time()
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error("Error setting cache: %s", e)

    def create_job(self, job_id: str, filename: str, src_lang: str, tgt_lang: str, total_pages: int = 0, is_guest: bool = False, user_email: Optional[str] = None, user_name: Optional[str] = None) -> Dict[str, Any]:
        is_guest_mode = is_guest or job_id.startswith("guest_") or guest_context_var.get()
        job_doc = {
            "job_id": job_id,
            "filename": filename,
            "src_lang": src_lang,
            "tgt_lang": tgt_lang,
            "status": "pending",  # pending, processing, completed, failed
            "progress": 0.0,
            "total_pages": total_pages,
            "completed_pages": 0,
            "created_at": time.time(),
            "updated_at": time.time(),
            "error": None,
            "output_file": None,
            "is_guest": is_guest_mode,
            "user_email": user_email or ("Guest Session" if is_guest_mode else "Authenticated User"),
            "user_name": user_name or ("Guest User" if is_guest_mode else "Nexus User"),
        }
        if is_guest_mode:
            # Strictly temporary in-memory storage (zero database connection/writes)
            if job_id in self._guest_jobs:
                self._guest_jobs[job_id].update({
                    "filename": filename,
                    "src_lang": src_lang,
                    "tgt_lang": tgt_lang,
                    "total_pages": total_pages if total_pages > 0 else self._guest_jobs[job_id].get("total_pages", 0),
                    "updated_at": time.time(),
                    "user_email": job_doc["user_email"],
                    "user_name": job_doc["user_name"],
                })
            else:
                self._guest_jobs[job_id] = job_doc
            return self._guest_jobs[job_id]

        if self.is_connected:
            try:
                self.jobs_col.update_one(
                    {"job_id": job_id},
                    {
                        "$set": {
                            "job_id": job_id,
                            "filename": filename,
                            "src_lang": src_lang,
                            "tgt_lang": tgt_lang,
                            "total_pages": total_pages,
                            "updated_at": time.time(),
                            "is_guest": is_guest_mode,
                            "user_email": job_doc["user_email"],
                            "user_name": job_doc["user_name"],
                        },
                        "$setOnInsert": {
                            "status": "pending",
                            "progress": 0.0,
                            "completed_pages": 0,
                            "created_at": time.time(),
                            "error": None,
                            "output_file": None,
                        }
                    },
                    upsert=True
                )
            except Exception as e:
                logger.error("Error creating/updating job in Mongo: %s", e)
        else:
            if job_id in self._memory_jobs:
                self._memory_jobs[job_id].update({
                    "filename": filename,
                    "src_lang": src_lang,
                    "tgt_lang": tgt_lang,
                    "total_pages": total_pages if total_pages > 0 else self._memory_jobs[job_id].get("total_pages", 0),
                    "updated_at": time.time(),
                    "user_email": job_doc["user_email"],
                    "user_name": job_doc["user_name"],
                })
            else:
                self._memory_jobs[job_id] = job_doc
        return job_doc

    def update_job_progress(
        self, 
        job_id: str, 
        completed_pages: int, 
        total_pages: int, 
        status: str = "processing",
        latest_page_num: Optional[int] = None,
        latest_translated_text: Optional[str] = None,
        latest_blocks: Optional[List[Dict[str, Any]]] = None,
        latest_page_image: Optional[str] = None,
        output_file: Optional[str] = None,
        **extra
    ):
        progress = (completed_pages / total_pages * 100) if total_pages > 0 else 0.0
        update_fields: Dict[str, Any] = {
            "status": status,
            "completed_pages": completed_pages,
            "total_pages": total_pages,
            "progress": round(progress, 2),
            "updated_at": time.time()
        }
        if latest_page_num is not None:
            update_fields["latest_page_num"] = latest_page_num
        if latest_translated_text is not None:
            update_fields["latest_translated_text"] = latest_translated_text
        if latest_blocks is not None:
            update_fields["latest_blocks"] = latest_blocks
        if latest_page_image is not None:
            update_fields["latest_page_image"] = latest_page_image
        if output_file is not None:
            update_fields["output_file"] = output_file
        for k, v in extra.items():
            if v is not None:
                update_fields[k] = v

        if job_id in self._guest_jobs:
            self._guest_jobs[job_id].update(update_fields)
            return

        if not self.is_connected:
            if job_id in self._memory_jobs:
                self._memory_jobs[job_id].update(update_fields)
            return

        try:
            self.jobs_col.update_one(
                {"job_id": job_id},
                {"$set": update_fields}
            )
        except Exception as e:
            logger.error("Error updating job progress: %s", e)

    def complete_job(self, job_id: str, output_file: str):
        fields = {
            "status": "completed",
            "progress": 100.0,
            "output_file": output_file,
            "completed_at": time.time(),
            "updated_at": time.time()
        }
        if job_id in self._guest_jobs:
            self._guest_jobs[job_id].update(fields)
            return

        if not self.is_connected:
            if job_id in self._memory_jobs:
                self._memory_jobs[job_id].update(fields)
            return

        try:
            self.jobs_col.update_one(
                {"job_id": job_id},
                {"$set": fields}
            )
        except Exception as e:
            logger.error("Error completing job: %s", e)

    def fail_job(self, job_id: str, error_msg: str):
        fields = {
            "status": "failed",
            "error": error_msg,
            "updated_at": time.time()
        }
        if job_id in self._guest_jobs:
            self._guest_jobs[job_id].update(fields)
            return

        if not self.is_connected:
            if job_id in self._memory_jobs:
                self._memory_jobs[job_id].update(fields)
            return

        try:
            self.jobs_col.update_one(
                {"job_id": job_id},
                {"$set": fields}
            )
        except Exception as e:
            logger.error("Error failing job: %s", e)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id.startswith("guest_") or job_id in self._guest_jobs:
            return dict(self._guest_jobs[job_id]) if job_id in self._guest_jobs else None
        if not self.is_connected:
            return self._memory_jobs.get(job_id)
        try:
            doc = self.jobs_col.find_one({"job_id": job_id}, {"_id": 0})
            if doc:
                return doc
            return None
        except Exception as e:
            logger.error("Error fetching job: %s", e)
            return self._memory_jobs.get(job_id)

    def get_all_jobs(self, include_guest: bool = True) -> List[Dict[str, Any]]:
        jobs_map: Dict[str, Dict[str, Any]] = {}

        # 1. Fetch persistent jobs from Mongo if available
        if self.is_connected:
            try:
                for doc in self.jobs_col.find({}, {"_id": 0}).sort("created_at", -1):
                    jid = doc.get("job_id")
                    if jid:
                        jobs_map[jid] = doc
            except Exception as e:
                logger.error("Error fetching all jobs from Mongo: %s", e)

        # 2. Merge memory-only jobs
        for jid, job in self._memory_jobs.items():
            if jid not in jobs_map:
                jobs_map[jid] = dict(job)

        # 3. Merge guest jobs if requested
        if include_guest:
            for jid, job in self._guest_jobs.items():
                jobs_map[jid] = dict(job)

        result = list(jobs_map.values())
        result.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return result

    def delete_job(self, job_id: str) -> bool:
        deleted = False
        if job_id in self._guest_jobs:
            del self._guest_jobs[job_id]
            deleted = True
        if job_id in self._memory_jobs:
            del self._memory_jobs[job_id]
            deleted = True
        if self.is_connected:
            try:
                res = self.jobs_col.delete_one({"job_id": job_id})
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.error("Error deleting job %s from Mongo: %s", job_id, e)
        return deleted

# Singleton instance
mongo_db = MongoDBManager()

