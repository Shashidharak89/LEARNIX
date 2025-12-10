# Deleting Old Work Collection & Migration API

## ⚠️ Important: Backup First!

Before deleting, ensure:
1. ✅ All data is correctly migrated to User/Subject/Topic collections
2. ✅ All features work with new collections
3. ✅ Frontend displays data correctly
4. ✅ You have a MongoDB backup

## Step 1: Verify Data Migration

```bash
# Check counts match
curl http://localhost:3000/api/migrate

# Should show:
# - works: X
# - users: X (same number)
# - subjects: Y
# - topics: Z
```

## Step 2: Delete Work Collection (MongoDB)

**Option A: Using MongoDB Compass or Shell**
```javascript
// In MongoDB shell or Compass
use your_database_name;
db.works.drop();
```

**Option B: Add a cleanup endpoint** (temporary)
Create `/src/app/api/cleanup/route.js`:
```javascript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function DELETE(request) {
  try {
    await connectDB();
    
    // Delete Work collection
    await mongoose.connection.db.dropCollection('works');
    
    return NextResponse.json({
      success: true,
      message: "Work collection deleted successfully"
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

Then call:
```bash
curl -X DELETE http://localhost:3000/api/cleanup
```

## Step 3: Delete Migration API Route

```bash
# Delete the migration route file
rm src/app/api/migrate/route.js
```

## Step 4: Delete Work Model

```bash
# Delete the Work model
rm src/models/Work.js
```

## Step 5: Verify Application Still Works

Test these endpoints:
```bash
# Get all users/works
curl http://localhost:3000/api/work/getall

# Get specific user
curl "http://localhost:3000/api/work/get?usn=YOUR_USN"

# Get user profile
curl "http://localhost:3000/api/user?usn=YOUR_USN"
```

## Step 6: Clean Up Documentation (Optional)

Remove migration-related documentation:
```bash
rm MIGRATION_GUIDE.md
rm ARCHITECTURE.md
rm VISUAL_GUIDE.md
rm HOW_IT_WORKS.md
rm CHECKLIST.md
rm SUMMARY.md
```

Or keep them for historical reference.

## Rollback Plan

If something goes wrong:
1. Restore MongoDB backup
2. Restore deleted files from git history
3. Re-run migration if needed

---

**Recommendation**: Keep the Work collection for at least 30 days after migration as a safety backup, then delete it once you're 100% confident everything works perfectly.
