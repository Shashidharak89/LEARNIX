# Database Normalization - Migration Guide

## Overview

This project has been refactored to normalize the database structure by separating the monolithic `Work` collection into three separate collections: `User`, `Subject`, and `Topic`. The `Work` collection remains untouched and continues to exist as-is.

## New Database Structure

### 1. **User Collection** (`src/models/User.js`)
Stores user information extracted from the Work collection:
- `name`: User's full name
- `usn`: University Serial Number (unique identifier)
- `password`: Hashed password
- `profileimg`: Profile image URL
- `active`: Active time in minutes
- `createdAt`: Account creation timestamp

### 2. **Subject Collection** (`src/models/Subject.js`)
Stores subjects with references to users:
- `userId`: Reference to User collection
- `subject`: Subject name
- `public`: Visibility flag (public/private)
- `createdAt`: Creation timestamp

**Important**: Each user's subject is stored as a separate document, even if multiple users have subjects with the same name.

### 3. **Topic Collection** (`src/models/Topic.js`)
Stores topics with references to both users and subjects:
- `userId`: Reference to User collection
- `subjectId`: Reference to Subject collection
- `topic`: Topic name
- `content`: Topic content (text/HTML)
- `images`: Array of image URLs
- `public`: Visibility flag (public/private)
- `timestamp`: Creation/update timestamp

**Important**: Each user's topic is stored as a separate document, even if multiple users have topics with the same name.

## Migration Process

### Automatic Migration Endpoint

A migration API endpoint has been created at `/api/migrate` that automatically copies data from the Work collection to the new collections.

#### Running the Migration

**POST Request** - Execute migration:
```bash
curl -X POST http://localhost:3000/api/migrate
```

Response:
```json
{
  "success": true,
  "message": "Migration completed",
  "stats": {
    "totalWorks": 10,
    "usersCreated": 10,
    "subjectsCreated": 25,
    "topicsCreated": 100,
    "errors": 0
  }
}
```

**GET Request** - Check migration status:
```bash
curl http://localhost:3000/api/migrate
```

Response:
```json
{
  "success": true,
  "counts": {
    "works": 10,
    "users": 10,
    "subjects": 25,
    "topics": 100
  }
}
```

### Migration Features

1. **Idempotent**: Running the migration multiple times is safe. It checks if users already exist before creating them.
2. **Data Preservation**: The original Work collection remains untouched.
3. **Relationship Mapping**: Properly creates relationships between User → Subject → Topic.
4. **Error Handling**: Captures and reports errors for individual records without stopping the entire migration.

## Updated API Endpoints

All API endpoints have been updated to use the new normalized collections while maintaining the same request/response format. This ensures **zero breaking changes** for the frontend.

### Authentication Endpoints

- `POST /api/auth/login` - Uses User model
- `POST /api/auth/signup` - Uses User model
- `POST /api/auth` - Uses User model

### User Endpoints

- `GET /api/user?usn=XXX` - Fetches user with subjects and topics from new collections
- `GET /api/work/getall` - Returns all users from User collection
- `GET /api/user/all` - Search users with pagination
- `PUT /api/user/change-name` - Updates user name
- `PUT /api/user/change-password` - Updates user password
- `PUT /api/user/change-profileimg` - Updates profile image
- `POST /api/user/active` - Increments active time
- `GET /api/user/active?usn=XXX` - Gets active time

### Subject Endpoints

- `POST /api/subject` - Creates subject in Subject collection
- `DELETE /api/subject/delete` - Deletes subject and all related topics
- `GET /api/subject/public` - Gets all public subjects
- `PUT /api/subject/public` - Updates subject visibility

### Topic Endpoints

- `POST /api/topic` - Creates topic in Topic collection
- `DELETE /api/topic/delete` - Deletes topic
- `PUT /api/topic/update` - Adds images to topic
- `PUT /api/topic/public` - Updates topic visibility
- `PUT /api/topic/deleteimage` - Removes image from topic
- `POST /api/topic/upload` - Uploads image to topic
- `GET /api/topic/by-subject?subject=XXX` - Gets topics by subject name

### Work Endpoints

- `GET /api/work/get?usn=XXX` - Fetches user work from new collections (maintains same response format)
- `GET /api/work/getbytopicid/:id` - Gets topic details by ID

## Benefits of Normalization

1. **Scalability**: Easier to query and index individual collections
2. **Performance**: Faster queries as data is separated
3. **Flexibility**: Can query users, subjects, and topics independently
4. **Data Integrity**: Proper referential integrity with ObjectId references
5. **Maintainability**: Easier to update and maintain individual collections
6. **Unique Data**: Each user's subjects and topics are separate entities

## Backward Compatibility

- The Work collection remains in the database unchanged
- All API responses maintain the same structure
- Frontend code requires **no changes**
- Can continue using existing authentication and session management

## Development Workflow

1. **First Time Setup**:
   ```bash
   # Start the development server
   npm run dev
   
   # Run the migration
   curl -X POST http://localhost:3000/api/migrate
   ```

2. **Verify Migration**:
   ```bash
   # Check counts
   curl http://localhost:3000/api/migrate
   ```

3. **Test Endpoints**:
   ```bash
   # Test user endpoint
   curl "http://localhost:3000/api/user?usn=YOUR_USN"
   
   # Test work endpoint
   curl "http://localhost:3000/api/work/get?usn=YOUR_USN"
   ```

## Database Indexes

The new models include the following indexes for optimal performance:

- **User**: `usn` (unique)
- **Subject**: `userId + subject` (compound index)
- **Topic**: 
  - `userId + subjectId` (compound index)
  - `subjectId` (single index)

## Important Notes

1. **Data Uniqueness**: Even if two users have subjects or topics with the same name, they are stored as separate documents in the database.

2. **Migration Safety**: The migration script checks for existing users before creating new ones to prevent duplicates.

3. **Work Collection**: The original Work collection is NOT modified or deleted. It serves as a backup and reference.

4. **Future Operations**: All new data operations (create, update, delete) now work with the normalized collections (User, Subject, Topic).

## Troubleshooting

### Migration Failed
If migration fails, check:
- MongoDB connection string in `.env`
- Database permissions
- Server logs for detailed error messages

### Data Mismatch
If you notice data inconsistencies:
1. Check migration errors in the response
2. Verify MongoDB collections exist
3. Re-run migration if needed (it's safe to run multiple times)

### Performance Issues
If queries are slow:
1. Ensure indexes are created (they're auto-created by Mongoose)
2. Check MongoDB logs
3. Consider adding additional indexes based on query patterns

## Next Steps

1. ✅ Models created (User, Subject, Topic)
2. ✅ Migration script implemented
3. ✅ All API endpoints updated
4. ✅ Backward compatibility maintained
5. ⏭️ Monitor performance in production
6. ⏭️ Consider archiving old Work collection after verification

## Support

For any issues or questions regarding the migration, please check:
- Server console logs
- Migration endpoint error responses
- MongoDB logs

---

**Last Updated**: December 10, 2025
**Status**: ✅ Migration Complete and Tested
