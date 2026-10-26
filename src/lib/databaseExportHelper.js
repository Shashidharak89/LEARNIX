import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import User from "@/models/User";
import SMFiles from "@/models/SMFiles";
import SMSubject from "@/models/SMSubject";
import SMCollege from "@/models/SMCollege";
import SMUniversity from "@/models/SMUniversity";
import SMCourse from "@/models/SMCourse";
import SMSemester from "@/models/SMSemester";
import SMBatch from "@/models/SMBatch";
import Update from "@/models/Update";
import Work from "@/models/Work";
import { DATABASE_SCHEMAS } from "@/lib/databaseSchemas";

/**
 * Filter that matches all documents with public visibility:
 * - Explicit { visibility: "public" }
 * - Unlisted { visibility: "unlisted" }
 * - Legacy missing field { visibility: { $exists: false } }
 * - Null or empty string { visibility: null }
 * - Explicitly NOT { visibility: "private" } and NOT { public: false }
 */
export const PUBLIC_VISIBILITY_FILTER = {
  $and: [
    { visibility: { $nin: ["private"] } },
    { public: { $ne: false } }
  ]
};

/**
 * Escape a field for RFC 4180 compliant CSV.
 * - Handles quotes, commas, newlines, nulls, booleans, and objects.
 */
export function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  let str = typeof val === "object" ? JSON.stringify(val) : String(val);
  // If string contains quotes, commas, newlines, or carriage returns, wrap in quotes and double internal quotes
  if (/[",\r\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a date nicely for CSV output
 */
function formatDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toISOString();
  } catch {
    return String(date);
  }
}

/**
 * Get quick summary metrics across database collections
 */
export async function getDatabaseStats() {
  await connectDB();

  const [
    publicTopicsCount,
    publicSubjectsCount,
    studyMaterialsCount,
    smSubjectsCount,
    publicUpdatesCount,
    usersCount
  ] = await Promise.all([
    Topic.countDocuments(PUBLIC_VISIBILITY_FILTER).catch(() => 0),
    Subject.countDocuments(PUBLIC_VISIBILITY_FILTER).catch(() => 0),
    SMFiles.countDocuments({}).catch(() => 0),
    SMSubject.countDocuments({}).catch(() => 0),
    Update.countDocuments(PUBLIC_VISIBILITY_FILTER).catch(() => 0),
    User.countDocuments({}).catch(() => 0)
  ]);

  return {
    publicResourcesCount: publicTopicsCount + publicSubjectsCount,
    publicTopicsCount,
    publicSubjectsCount,
    studyMaterialsCount,
    smSubjectsCount,
    publicUpdatesCount,
    usersCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper to safely resolve a User from an ID with caching
 */
async function getUserMap(userIds) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean).map(String)));
  if (uniqueIds.length === 0) return new Map();

  const users = await User.find({ _id: { $in: uniqueIds } }).lean();
  const map = new Map();
  for (const u of users) {
    map.set(String(u._id), u);
  }
  return map;
}

/**
 * 1. Export Public Resources Data
 * Exhaustively exports all public topics and subjects with full dereferenced Subject and User records.
 */
export async function buildResourcesCSV(onProgress = () => {}) {
  await connectDB();

  onProgress({ percent: 5, processed: 0, total: 100, status: "Querying all public topics and subjects..." });

  // 1. Fetch public topics
  const topics = await Topic.find(PUBLIC_VISIBILITY_FILTER)
    .populate("subjectId")
    .populate("userId")
    .lean()
    .sort({ timestamp: -1 });

  // 2. Fetch public subjects
  const subjects = await Subject.find(PUBLIC_VISIBILITY_FILTER)
    .populate("userId")
    .lean()
    .sort({ createdAt: -1 });

  // 3. Fetch any public topics inside Work collection
  const works = await Work.find({}).lean().catch(() => []);

  // Collect any missing user IDs to batch fetch
  const missingUserIds = [];
  for (const t of topics) {
    const directUserId = t.userId?._id || t.userId;
    const subjectUserId = t.subjectId?.userId?._id || t.subjectId?.userId;
    if (!directUserId && subjectUserId) {
      missingUserIds.push(subjectUserId);
    }
  }

  const userCache = await getUserMap(missingUserIds);

  const totalEstimate = topics.length + subjects.length;
  onProgress({ percent: 25, processed: 0, total: totalEstimate, status: `Retrieved ${topics.length} public topics and ${subjects.length} public subjects. Dereferencing nested records...` });

  const headers = DATABASE_SCHEMAS.resources.headers;
  const rows = [headers.join(",")];
  let processedCount = 0;

  // Process public topics with full nested references
  for (const topic of topics) {
    const sub = (topic.subjectId && typeof topic.subjectId === "object") ? topic.subjectId : {};
    let usr = (topic.userId && typeof topic.userId === "object") ? topic.userId : null;

    // Fallback: If topic.userId was not populated or is string ID, check userCache or subject.userId
    if (!usr) {
      const targetUid = String(topic.userId || sub.userId || "");
      if (targetUid && userCache.has(targetUid)) {
        usr = userCache.get(targetUid);
      }
    }
    usr = usr || {};

    const imagesList = Array.isArray(topic.images) ? topic.images : (topic.images ? [topic.images] : []);
    const imagesStr = imagesList.join("; ");
    const imagesJson = JSON.stringify(imagesList);

    const row = [
      // Topic Attributes
      escapeCSV(topic._id),
      escapeCSV("Topic / Resource"),
      escapeCSV(topic.topic || ""),
      escapeCSV(topic.content || ""),
      escapeCSV(imagesList.length),
      escapeCSV(imagesStr),
      escapeCSV(imagesJson),
      escapeCSV(topic.downloadlink || ""),
      escapeCSV(topic.visibility || "public"),
      escapeCSV(formatDate(topic.timestamp)),
      escapeCSV(topic.__v ?? 0),
      // Subject Attributes
      escapeCSV(sub._id || topic.subjectId || ""),
      escapeCSV(sub.subject || ""),
      escapeCSV(sub.visibility || "public"),
      escapeCSV(formatDate(sub.createdAt)),
      escapeCSV(sub.__v ?? 0),
      // Author User Attributes
      escapeCSV(usr._id || topic.userId || sub.userId || ""),
      escapeCSV(usr.name || "Unknown"),
      escapeCSV(usr.usn || ""),
      escapeCSV(usr.email || ""),
      escapeCSV(usr.firebaseUid || ""),
      escapeCSV(usr.role || "user"),
      escapeCSV(usr.plan || "basic"),
      escapeCSV(usr.profileimg || ""),
      escapeCSV(usr.streaks ?? 1),
      escapeCSV(usr.highestStreak ?? 1),
      escapeCSV(usr.balance ?? 0),
      escapeCSV(Boolean(usr.password)),
      escapeCSV(formatDate(usr.lastLoginAt)),
      escapeCSV(formatDate(usr.tokenCreatedAt)),
      escapeCSV(formatDate(usr.createdAt)),
      escapeCSV(usr.__v ?? 0)
    ];

    rows.push(row.join(","));
    processedCount++;

    if (processedCount % 50 === 0 || processedCount === topics.length) {
      const pct = Math.min(80, 25 + Math.round((processedCount / (totalEstimate || 1)) * 55));
      onProgress({ percent: pct, processed: processedCount, total: totalEstimate, status: `Formatting topics with nested data (${processedCount}/${totalEstimate})...` });
    }
  }

  // Include standalone public subjects (subjects that have no topic records)
  const coveredSubjectIds = new Set(topics.map((t) => String(t.subjectId?._id || t.subjectId || "")));

  for (const sub of subjects) {
    if (!coveredSubjectIds.has(String(sub._id))) {
      const usr = (sub.userId && typeof sub.userId === "object") ? sub.userId : {};
      const row = [
        // Topic Attributes (empty placeholder for subject container)
        escapeCSV(`sub-only-${sub._id}`),
        escapeCSV("Subject (No Individual Topics)"),
        escapeCSV(sub.subject || ""),
        escapeCSV(""),
        escapeCSV(0),
        escapeCSV(""),
        escapeCSV("[]"),
        escapeCSV(""),
        escapeCSV(sub.visibility || "public"),
        escapeCSV(formatDate(sub.createdAt)),
        escapeCSV(0),
        // Subject Attributes
        escapeCSV(sub._id),
        escapeCSV(sub.subject || ""),
        escapeCSV(sub.visibility || "public"),
        escapeCSV(formatDate(sub.createdAt)),
        escapeCSV(sub.__v ?? 0),
        // Author User Attributes
        escapeCSV(usr._id || sub.userId || ""),
        escapeCSV(usr.name || "Unknown"),
        escapeCSV(usr.usn || ""),
        escapeCSV(usr.email || ""),
        escapeCSV(usr.firebaseUid || ""),
        escapeCSV(usr.role || "user"),
        escapeCSV(usr.plan || "basic"),
        escapeCSV(usr.profileimg || ""),
        escapeCSV(usr.streaks ?? 1),
        escapeCSV(usr.highestStreak ?? 1),
        escapeCSV(usr.balance ?? 0),
        escapeCSV(Boolean(usr.password)),
        escapeCSV(formatDate(usr.lastLoginAt)),
        escapeCSV(formatDate(usr.tokenCreatedAt)),
        escapeCSV(formatDate(usr.createdAt)),
        escapeCSV(usr.__v ?? 0)
      ];
      rows.push(row.join(","));
    }
    processedCount++;
  }

  // Also include public topics from legacy Work model if any
  for (const work of works) {
    if (Array.isArray(work.subjects)) {
      for (const wSub of work.subjects) {
        if (wSub.public !== false) {
          if (Array.isArray(wSub.topics)) {
            for (const wTopic of wSub.topics) {
              if (wTopic.public !== false) {
                const imgList = Array.isArray(wTopic.images) ? wTopic.images : [];
                const row = [
                  escapeCSV(wTopic._id || `${work.usn}-${wSub.subject}-${wTopic.topic}`),
                  escapeCSV("Work / Legacy Resource"),
                  escapeCSV(wTopic.topic || ""),
                  escapeCSV(wTopic.content || ""),
                  escapeCSV(imgList.length),
                  escapeCSV(imgList.join("; ")),
                  escapeCSV(JSON.stringify(imgList)),
                  escapeCSV(""),
                  escapeCSV("public"),
                  escapeCSV(formatDate(wTopic.timestamp)),
                  escapeCSV(0),
                  escapeCSV(wSub._id || ""),
                  escapeCSV(wSub.subject || ""),
                  escapeCSV("public"),
                  escapeCSV(formatDate(work.createdAt)),
                  escapeCSV(0),
                  escapeCSV(work._id || ""),
                  escapeCSV(work.name || ""),
                  escapeCSV(work.usn || ""),
                  escapeCSV(""),
                  escapeCSV(""),
                  escapeCSV("user"),
                  escapeCSV("basic"),
                  escapeCSV(work.profileimg || ""),
                  escapeCSV(1),
                  escapeCSV(1),
                  escapeCSV(0),
                  escapeCSV(Boolean(work.password)),
                  escapeCSV(""),
                  escapeCSV(""),
                  escapeCSV(formatDate(work.createdAt)),
                  escapeCSV(0)
                ];
                rows.push(row.join(","));
              }
            }
          }
        }
      }
    }
  }

  onProgress({ percent: 96, processed: rows.length - 1, total: rows.length - 1, status: "Finalizing public resources CSV payload..." });

  const csvContent = rows.join("\r\n");
  const filename = "Resources.csv";

  onProgress({ percent: 100, processed: rows.length - 1, total: rows.length - 1, status: "Complete" });

  return {
    filename,
    csvContent,
    rowCount: rows.length - 1,
    sizeBytes: Buffer.byteLength(csvContent, "utf8")
  };
}

/**
 * 2. Export Study Materials Data
 * Complete dereferenced hierarchy: SMFiles -> SMSubject -> SMCollege -> SMUniversity, SMCourse, SMSemester, SMBatch.
 */
export async function buildStudyMaterialsCSV(onProgress = () => {}) {
  await connectDB();

  onProgress({ percent: 10, processed: 0, total: 100, status: "Querying study materials and relational hierarchy..." });

  // Ensure Mongoose models are registered
  void [SMUniversity, SMCollege, SMCourse, SMSemester, SMBatch, SMSubject, SMFiles];

  const files = await SMFiles.find({})
    .populate({
      path: "sub",
      populate: [
        { path: "college", populate: { path: "university" } },
        { path: "course" },
        { path: "sem" },
        { path: "batch" }
      ]
    })
    .lean()
    .sort({ createdAt: -1 });

  const subjects = await SMSubject.find({})
    .populate([
      { path: "college", populate: { path: "university" } },
      { path: "course" },
      { path: "sem" },
      { path: "batch" }
    ])
    .lean()
    .sort({ createdAt: -1 });

  const totalEstimate = files.length;
  onProgress({ percent: 30, processed: 0, total: totalEstimate, status: `Traversing ${files.length} files and ${subjects.length} subjects...` });

  const headers = DATABASE_SCHEMAS["study-materials"].headers;
  const rows = [headers.join(",")];
  let processedCount = 0;

  for (const file of files) {
    const sub = file.sub || {};
    const college = sub.college || {};
    const univ = college.university || {};
    const course = sub.course || {};
    const sem = sub.sem || {};
    const batch = sub.batch || {};

    const batchLabel = (batch.startyear && batch.endyear)
      ? `${batch.startyear} - ${batch.endyear}`
      : (batch.startyear || batch.batch || "");

    const row = [
      // File Attributes
      escapeCSV(file._id),
      escapeCSV(file.name || "Untitled File"),
      escapeCSV(file.fileurl || ""),
      escapeCSV(file.type || "default"),
      escapeCSV(formatDate(file.createdAt)),
      escapeCSV(formatDate(file.updatedAt)),
      escapeCSV(file.__v ?? 0),
      // Subject Attributes
      escapeCSV(sub._id || ""),
      escapeCSV(sub.name || ""),
      escapeCSV(formatDate(sub.createdAt)),
      escapeCSV(formatDate(sub.updatedAt)),
      escapeCSV(sub.__v ?? 0),
      // College Attributes
      escapeCSV(college._id || ""),
      escapeCSV(college.name || ""),
      escapeCSV(college.location || ""),
      escapeCSV(formatDate(college.createdAt)),
      escapeCSV(formatDate(college.updatedAt)),
      escapeCSV(college.__v ?? 0),
      // University Attributes
      escapeCSV(univ._id || ""),
      escapeCSV(univ.name || ""),
      escapeCSV(univ.city || ""),
      escapeCSV(univ.district || ""),
      escapeCSV(formatDate(univ.createdAt)),
      escapeCSV(formatDate(univ.updatedAt)),
      escapeCSV(univ.__v ?? 0),
      // Course Attributes
      escapeCSV(course._id || ""),
      escapeCSV(course.name || ""),
      escapeCSV(formatDate(course.createdAt)),
      escapeCSV(formatDate(course.updatedAt)),
      escapeCSV(course.__v ?? 0),
      // Semester Attributes
      escapeCSV(sem._id || ""),
      escapeCSV(sem.sem ?? ""),
      escapeCSV(formatDate(sem.createdAt)),
      escapeCSV(formatDate(sem.updatedAt)),
      escapeCSV(sem.__v ?? 0),
      // Batch Attributes
      escapeCSV(batch._id || ""),
      escapeCSV(batch.startyear ?? ""),
      escapeCSV(batch.endyear ?? ""),
      escapeCSV(batchLabel),
      escapeCSV(formatDate(batch.createdAt)),
      escapeCSV(formatDate(batch.updatedAt)),
      escapeCSV(batch.__v ?? 0)
    ];

    rows.push(row.join(","));
    processedCount++;

    if (processedCount % 50 === 0 || processedCount === files.length) {
      const pct = Math.min(88, 30 + Math.round((processedCount / (totalEstimate || 1)) * 58));
      onProgress({ percent: pct, processed: processedCount, total: totalEstimate, status: `Formatting study material taxonomy (${processedCount}/${totalEstimate})...` });
    }
  }

  // Include subjects with no files to prevent taxonomy gaps
  const coveredSubjectIds = new Set(files.map((f) => String(f.sub?._id || "")));
  for (const sub of subjects) {
    if (!coveredSubjectIds.has(String(sub._id))) {
      const college = sub.college || {};
      const univ = college.university || {};
      const course = sub.course || {};
      const sem = sub.sem || {};
      const batch = sub.batch || {};
      const batchLabel = (batch.startyear && batch.endyear)
        ? `${batch.startyear} - ${batch.endyear}`
        : (batch.startyear || batch.batch || "");

      const row = [
        escapeCSV(`sub-entry-${sub._id}`),
        escapeCSV("(Subject Directory Entry - No files uploaded yet)"),
        escapeCSV(""),
        escapeCSV("directory"),
        escapeCSV(formatDate(sub.createdAt)),
        escapeCSV(formatDate(sub.updatedAt)),
        escapeCSV(0),
        escapeCSV(sub._id),
        escapeCSV(sub.name || ""),
        escapeCSV(formatDate(sub.createdAt)),
        escapeCSV(formatDate(sub.updatedAt)),
        escapeCSV(sub.__v ?? 0),
        escapeCSV(college._id || ""),
        escapeCSV(college.name || ""),
        escapeCSV(college.location || ""),
        escapeCSV(formatDate(college.createdAt)),
        escapeCSV(formatDate(college.updatedAt)),
        escapeCSV(college.__v ?? 0),
        escapeCSV(univ._id || ""),
        escapeCSV(univ.name || ""),
        escapeCSV(univ.city || ""),
        escapeCSV(univ.district || ""),
        escapeCSV(formatDate(univ.createdAt)),
        escapeCSV(formatDate(univ.updatedAt)),
        escapeCSV(univ.__v ?? 0),
        escapeCSV(course._id || ""),
        escapeCSV(course.name || ""),
        escapeCSV(formatDate(course.createdAt)),
        escapeCSV(formatDate(course.updatedAt)),
        escapeCSV(course.__v ?? 0),
        escapeCSV(sem._id || ""),
        escapeCSV(sem.sem ?? ""),
        escapeCSV(formatDate(sem.createdAt)),
        escapeCSV(formatDate(sem.updatedAt)),
        escapeCSV(sem.__v ?? 0),
        escapeCSV(batch._id || ""),
        escapeCSV(batch.startyear ?? ""),
        escapeCSV(batch.endyear ?? ""),
        escapeCSV(batchLabel),
        escapeCSV(formatDate(batch.createdAt)),
        escapeCSV(formatDate(batch.updatedAt)),
        escapeCSV(batch.__v ?? 0)
      ];
      rows.push(row.join(","));
    }
  }

  onProgress({ percent: 96, processed: rows.length - 1, total: rows.length - 1, status: "Finalizing study materials CSV..." });

  const csvContent = rows.join("\r\n");
  const filename = "Study_Materials.csv";

  onProgress({ percent: 100, processed: rows.length - 1, total: rows.length - 1, status: "Complete" });

  return {
    filename,
    csvContent,
    rowCount: rows.length - 1,
    sizeBytes: Buffer.byteLength(csvContent, "utf8")
  };
}

/**
 * 3. Export Public Updates Data
 * Exhaustively fetches ALL updates with public visibility (including older docs without explicit field)
 * and deep-dereferences author User profile details and Cloudinary file attachments.
 */
export async function buildUpdatesCSV(onProgress = () => {}) {
  await connectDB();

  onProgress({ percent: 10, processed: 0, total: 100, status: "Querying all public updates from database..." });

  // Use PUBLIC_VISIBILITY_FILTER to ensure ZERO public updates are missed
  const updates = await Update.find(PUBLIC_VISIBILITY_FILTER)
    .populate("userId")
    .lean()
    .sort({ createdAt: -1 });

  const totalItems = updates.length;
  onProgress({ percent: 30, processed: 0, total: totalItems, status: `Retrieved ${totalItems} public updates. Dereferencing author profiles and files...` });

  const headers = DATABASE_SCHEMAS.updates.headers;
  const rows = [headers.join(",")];
  let processedCount = 0;

  for (const upd of updates) {
    const usr = (upd.userId && typeof upd.userId === "object") ? upd.userId : {};
    const linksList = Array.isArray(upd.links) ? upd.links : [];
    const linksStr = linksList.join("; ");
    const linksJson = JSON.stringify(linksList);

    const filesList = Array.isArray(upd.files) ? upd.files : [];
    const fileNames = filesList.map((f) => f.name || "unnamed").join("; ");
    const fileUrls = filesList.map((f) => f.url || "").join("; ");
    const filePublicIds = filesList.map((f) => f.publicId || "").join("; ");
    const fileResourceTypes = filesList.map((f) => f.resourceType || "raw").join("; ");
    const filesJson = JSON.stringify(filesList);

    const row = [
      // Update Attributes
      escapeCSV(upd._id),
      escapeCSV(upd.title || ""),
      escapeCSV(upd.content || ""),
      escapeCSV(upd.visibility || "public"),
      escapeCSV(linksList.length),
      escapeCSV(linksStr),
      escapeCSV(linksJson),
      escapeCSV(filesList.length),
      escapeCSV(fileNames),
      escapeCSV(fileUrls),
      escapeCSV(filePublicIds),
      escapeCSV(fileResourceTypes),
      escapeCSV(filesJson),
      escapeCSV(formatDate(upd.createdAt)),
      escapeCSV(formatDate(upd.updatedAt)),
      escapeCSV(upd.__v ?? 0),
      // Author User Attributes
      escapeCSV(usr._id || upd.userId || ""),
      escapeCSV(usr.name || "Unknown"),
      escapeCSV(usr.usn || ""),
      escapeCSV(usr.email || ""),
      escapeCSV(usr.firebaseUid || ""),
      escapeCSV(usr.role || "user"),
      escapeCSV(usr.plan || "basic"),
      escapeCSV(usr.profileimg || ""),
      escapeCSV(usr.streaks ?? 1),
      escapeCSV(usr.highestStreak ?? 1),
      escapeCSV(usr.balance ?? 0),
      escapeCSV(Boolean(usr.password)),
      escapeCSV(formatDate(usr.lastLoginAt)),
      escapeCSV(formatDate(usr.tokenCreatedAt)),
      escapeCSV(formatDate(usr.createdAt)),
      escapeCSV(usr.__v ?? 0)
    ];

    rows.push(row.join(","));
    processedCount++;

    if (processedCount % 40 === 0 || processedCount === updates.length) {
      const pct = Math.min(88, 30 + Math.round((processedCount / (totalItems || 1)) * 58));
      onProgress({ percent: pct, processed: processedCount, total: totalItems, status: `Formatting updates (${processedCount}/${totalItems})...` });
    }
  }

  onProgress({ percent: 96, processed: rows.length - 1, total: rows.length - 1, status: "Finalizing updates CSV payload..." });

  const csvContent = rows.join("\r\n");
  const filename = "Updates.csv";

  onProgress({ percent: 100, processed: rows.length - 1, total: rows.length - 1, status: "Complete" });

  return {
    filename,
    csvContent,
    rowCount: rows.length - 1,
    sizeBytes: Buffer.byteLength(csvContent, "utf8")
  };
}

/**
 * 4. Export Users Data with All Uploads
 * Complete account profile attributes combined with aggregated uploads (subjects, topics, updates).
 */
export async function buildUsersCSV(onProgress = () => {}) {
  await connectDB();

  onProgress({ percent: 10, processed: 0, total: 100, status: "Loading all registered users..." });

  const users = await User.find({}).lean().sort({ createdAt: -1 });
  const totalUsers = users.length;

  onProgress({ percent: 25, processed: 0, total: totalUsers, status: `Loaded ${totalUsers} users. Aggregating all upload collections...` });

  // Query all subjects, topics, and updates in parallel
  const [allSubjects, allTopics, allUpdates] = await Promise.all([
    Subject.find({}).lean(),
    Topic.find({}).lean(),
    Update.find({}).lean()
  ]);

  onProgress({ percent: 45, processed: 0, total: totalUsers, status: "Grouping uploads by user..." });

  // Group subjects by userId
  const userSubjectsMap = new Map();
  for (const s of allSubjects) {
    const uid = String(s.userId || "");
    if (!userSubjectsMap.has(uid)) userSubjectsMap.set(uid, []);
    userSubjectsMap.get(uid).push(s);
  }

  // Group topics by userId
  const userTopicsMap = new Map();
  for (const t of allTopics) {
    const uid = String(t.userId || "");
    if (!userTopicsMap.has(uid)) userTopicsMap.set(uid, []);
    userTopicsMap.get(uid).push(t);
  }

  // Group updates by userId
  const userUpdatesMap = new Map();
  for (const u of allUpdates) {
    const uid = String(u.userId || "");
    if (!userUpdatesMap.has(uid)) userUpdatesMap.set(uid, []);
    userUpdatesMap.get(uid).push(u);
  }

  const headers = DATABASE_SCHEMAS.users.headers;
  const rows = [headers.join(",")];
  let processedCount = 0;

  for (const user of users) {
    const uid = String(user._id);

    const subs = userSubjectsMap.get(uid) || [];
    const publicSubs = subs.filter((s) => s.visibility !== "private" && s.public !== false);
    const privateSubs = subs.filter((s) => s.visibility === "private" || s.public === false);

    const tops = userTopicsMap.get(uid) || [];
    const publicTops = tops.filter((t) => t.visibility !== "private" && t.public !== false);
    const privateTops = tops.filter((t) => t.visibility === "private" || t.public === false);

    const upds = userUpdatesMap.get(uid) || [];
    const publicUpds = upds.filter((u) => u.visibility !== "private" && u.public !== false);
    const privateUpds = upds.filter((u) => u.visibility === "private" || u.public === false);

    let totalUpdateFiles = 0;
    for (const u of upds) {
      if (Array.isArray(u.files)) {
        totalUpdateFiles += u.files.length;
      }
    }

    const publicSubNames = publicSubs.map((s) => s.subject || "").slice(0, 100).join("; ");
    const publicSubIds = publicSubs.map((s) => s._id).slice(0, 100).join("; ");

    const publicTopTitles = publicTops.map((t) => t.topic || "").slice(0, 100).join("; ");
    const publicTopIds = publicTops.map((t) => t._id).slice(0, 100).join("; ");

    const publicUpdTitles = publicUpds.map((u) => u.title || "").slice(0, 100).join("; ");
    const publicUpdIds = publicUpds.map((u) => u._id).slice(0, 100).join("; ");

    const combinedTotal = subs.length + tops.length + upds.length;

    const summaryObj = {
      subjects: { total: subs.length, public: publicSubs.length, private: privateSubs.length },
      topics: { total: tops.length, public: publicTops.length, private: privateTops.length },
      updates: { total: upds.length, public: publicUpds.length, private: privateUpds.length, attachedFiles: totalUpdateFiles },
      combinedTotalUploads: combinedTotal
    };

    const row = [
      // Core User Attributes
      escapeCSV(user._id),
      escapeCSV(user.name || ""),
      escapeCSV(user.usn || ""),
      escapeCSV(user.email || ""),
      escapeCSV(user.firebaseUid || ""),
      escapeCSV(user.role || "user"),
      escapeCSV(user.plan || "basic"),
      escapeCSV(user.profileimg || ""),
      escapeCSV(user.streaks ?? 1),
      escapeCSV(user.highestStreak ?? 1),
      escapeCSV(user.balance ?? 0),
      escapeCSV(Boolean(user.password)),
      escapeCSV(formatDate(user.lastLoginAt)),
      escapeCSV(formatDate(user.tokenCreatedAt)),
      escapeCSV(formatDate(user.createdAt)),
      escapeCSV(user.__v ?? 0),
      // Upload Metrics & Aggregations
      escapeCSV(subs.length),
      escapeCSV(publicSubs.length),
      escapeCSV(privateSubs.length),
      escapeCSV(publicSubNames),
      escapeCSV(publicSubIds),
      escapeCSV(tops.length),
      escapeCSV(publicTops.length),
      escapeCSV(privateTops.length),
      escapeCSV(publicTopTitles),
      escapeCSV(publicTopIds),
      escapeCSV(upds.length),
      escapeCSV(publicUpds.length),
      escapeCSV(privateUpds.length),
      escapeCSV(publicUpdTitles),
      escapeCSV(publicUpdIds),
      escapeCSV(totalUpdateFiles),
      escapeCSV(combinedTotal),
      escapeCSV(JSON.stringify(summaryObj))
    ];

    rows.push(row.join(","));
    processedCount++;

    if (processedCount % 50 === 0 || processedCount === users.length) {
      const pct = Math.min(88, 45 + Math.round((processedCount / (totalUsers || 1)) * 43));
      onProgress({ percent: pct, processed: processedCount, total: totalUsers, status: `Compiling user upload metrics (${processedCount}/${totalUsers})...` });
    }
  }

  onProgress({ percent: 96, processed: rows.length - 1, total: rows.length - 1, status: "Finalizing users CSV..." });

  const csvContent = rows.join("\r\n");
  const filename = "Users.csv";

  onProgress({ percent: 100, processed: rows.length - 1, total: rows.length - 1, status: "Complete" });

  return {
    filename,
    csvContent,
    rowCount: rows.length - 1,
    sizeBytes: Buffer.byteLength(csvContent, "utf8")
  };
}

/**
 * 5. Master export function dispatching by collection name
 */
export async function generateCollectionCSV(collectionType, onProgress = () => {}) {
  switch (collectionType) {
    case "resources":
      return buildResourcesCSV(onProgress);
    case "study-materials":
      return buildStudyMaterialsCSV(onProgress);
    case "updates":
      return buildUpdatesCSV(onProgress);
    case "users":
      return buildUsersCSV(onProgress);
    default:
      throw new Error(`Unknown export collection type: "${collectionType}"`);
  }
}
