import mongoose from "mongoose";
import UpdatesInteraction from "@/models/UpdatesInteraction";
import ResourcesInteraction from "@/models/ResourcesInteraction";

/**
 * Filter and deduplicate valid MongoDB ObjectIds from input
 */
function toValidObjectIds(ids) {
  if (!ids) return [];
  const list = Array.isArray(ids) ? ids : [ids];
  const unique = new Set();
  const valid = [];

  for (const item of list) {
    if (!item) continue;
    const str = typeof item === "object" && item._id ? item._id.toString() : item.toString();
    if (mongoose.Types.ObjectId.isValid(str) && !unique.has(str)) {
      unique.add(str);
      valid.push(new mongoose.Types.ObjectId(str));
    }
  }

  return valid;
}

/**
 * Atomically increments views by +1 for a list of update IDs (creating them with views: 1 if missing),
 * and returns a map of { [updateId]: viewsCount }.
 */
export async function recordUpdateViews(updateIds) {
  const validIds = toValidObjectIds(updateIds);
  if (validIds.length === 0) return {};

  try {
    const ops = validIds.map((id) => ({
      updateOne: {
        filter: { update_id: id },
        update: { $inc: { views: 1 } },
        upsert: true,
      },
    }));

    await UpdatesInteraction.bulkWrite(ops, { ordered: false });

    const records = await UpdatesInteraction.find(
      { update_id: { $in: validIds } },
      { update_id: 1, views: 1 }
    ).lean();

    const viewsMap = {};
    for (const r of records) {
      if (r?.update_id) {
        viewsMap[r.update_id.toString()] = r.views ?? 1;
      }
    }

    // Default any requested ID to at least 1 view
    for (const id of validIds) {
      const key = id.toString();
      if (viewsMap[key] === undefined) {
        viewsMap[key] = 1;
      }
    }

    return viewsMap;
  } catch (err) {
    console.error("recordUpdateViews error:", err);
    // Return graceful fallback of 0 for all IDs so API continues normally
    const fallback = {};
    for (const id of validIds) {
      fallback[id.toString()] = 0;
    }
    return fallback;
  }
}

/**
 * Atomically increments views for a single update ID and returns the updated views count.
 */
export async function recordSingleUpdateView(updateId) {
  if (!updateId || !mongoose.Types.ObjectId.isValid(updateId.toString())) {
    return 0;
  }

  try {
    const objId = new mongoose.Types.ObjectId(updateId.toString());
    const doc = await UpdatesInteraction.findOneAndUpdate(
      { update_id: objId },
      { $inc: { views: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return doc?.views ?? 1;
  } catch (err) {
    console.error("recordSingleUpdateView error:", err);
    return 0;
  }
}

/**
 * Read views for updates without incrementing.
 */
export async function getUpdateViews(updateIds) {
  const validIds = toValidObjectIds(updateIds);
  if (validIds.length === 0) return {};

  try {
    const records = await UpdatesInteraction.find(
      { update_id: { $in: validIds } },
      { update_id: 1, views: 1 }
    ).lean();

    const viewsMap = {};
    for (const r of records) {
      if (r?.update_id) {
        viewsMap[r.update_id.toString()] = r.views ?? 0;
      }
    }

    for (const id of validIds) {
      const key = id.toString();
      if (viewsMap[key] === undefined) {
        viewsMap[key] = 0;
      }
    }

    return viewsMap;
  } catch (err) {
    console.error("getUpdateViews error:", err);
    return {};
  }
}

/**
 * Atomically increments views by +1 for a list of resource/topic IDs (creating them with views: 1 if missing),
 * and returns a map of { [resourceId]: viewsCount }.
 */
export async function recordResourceViews(resourceIds) {
  const validIds = toValidObjectIds(resourceIds);
  if (validIds.length === 0) return {};

  try {
    const ops = validIds.map((id) => ({
      updateOne: {
        filter: { resource_id: id },
        update: {
          $inc: { views: 1 },
          $setOnInsert: { resourceid: id.toString() },
        },
        upsert: true,
      },
    }));

    await ResourcesInteraction.bulkWrite(ops, { ordered: false });

    const records = await ResourcesInteraction.find(
      { resource_id: { $in: validIds } },
      { resource_id: 1, views: 1 }
    ).lean();

    const viewsMap = {};
    for (const r of records) {
      if (r?.resource_id) {
        viewsMap[r.resource_id.toString()] = r.views ?? 1;
      }
    }

    // Default any requested ID to at least 1 view
    for (const id of validIds) {
      const key = id.toString();
      if (viewsMap[key] === undefined) {
        viewsMap[key] = 1;
      }
    }

    return viewsMap;
  } catch (err) {
    console.error("recordResourceViews error:", err);
    const fallback = {};
    for (const id of validIds) {
      fallback[id.toString()] = 0;
    }
    return fallback;
  }
}

/**
 * Atomically increments views for a single resource/topic ID and returns the updated views count.
 */
export async function recordSingleResourceView(resourceId) {
  if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId.toString())) {
    return 0;
  }

  try {
    const objId = new mongoose.Types.ObjectId(resourceId.toString());
    const doc = await ResourcesInteraction.findOneAndUpdate(
      { resource_id: objId },
      {
        $inc: { views: 1 },
        $setOnInsert: { resourceid: objId.toString() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return doc?.views ?? 1;
  } catch (err) {
    console.error("recordSingleResourceView error:", err);
    return 0;
  }
}

/**
 * Read views for resources without incrementing.
 */
export async function getResourceViews(resourceIds) {
  const validIds = toValidObjectIds(resourceIds);
  if (validIds.length === 0) return {};

  try {
    const records = await ResourcesInteraction.find(
      { resource_id: { $in: validIds } },
      { resource_id: 1, views: 1 }
    ).lean();

    const viewsMap = {};
    for (const r of records) {
      if (r?.resource_id) {
        viewsMap[r.resource_id.toString()] = r.views ?? 0;
      }
    }

    for (const id of validIds) {
      const key = id.toString();
      if (viewsMap[key] === undefined) {
        viewsMap[key] = 0;
      }
    }

    return viewsMap;
  } catch (err) {
    console.error("getResourceViews error:", err);
    return {};
  }
}
