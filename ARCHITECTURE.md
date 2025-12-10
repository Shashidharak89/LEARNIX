# Database Architecture - Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LEARNIX Database Architecture                │
└─────────────────────────────────────────────────────────────────┘

Before Normalization (Embedded Document Model):
┌──────────────────────────────────────────────────────────────┐
│                      Work Collection                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  User Data (name, usn, password, profileimg)          │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Subjects Array                                  │ │  │
│  │  │  ┌────────────────────────────────────────────┐ │ │  │
│  │  │  │  Topics Array (content, images)           │ │ │  │
│  │  │  └────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

After Normalization (Referenced Model):
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ User Collection│      │Subject Collect │      │ Topic Collect  │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ _id (PK)       │◄─────│ userId (FK)    │◄─────│ userId (FK)    │
│ name           │      │ _id (PK)       │◄─────│ subjectId (FK) │
│ usn (unique)   │      │ subject        │      │ _id (PK)       │
│ password       │      │ public         │      │ topic          │
│ profileimg     │      │ createdAt      │      │ content        │
│ active         │      └────────────────┘      │ images[]       │
│ createdAt      │                               │ public         │
└────────────────┘                               │ timestamp      │
                                                 └────────────────┘
```

## Data Relationships

### One-to-Many Relationships

1. **User → Subjects** (One user has many subjects)
   - Reference: `Subject.userId → User._id`
   - Cascade: Deleting a subject deletes all related topics

2. **Subject → Topics** (One subject has many topics)
   - Reference: `Topic.subjectId → Subject._id`
   - Cascade: Implemented in delete endpoints

3. **User → Topics** (One user has many topics)
   - Reference: `Topic.userId → User._id`
   - Purpose: Direct user-to-topic relationship for queries

## Database Indexes

### User Collection
```javascript
{
  usn: 1  // Unique index for fast user lookups
}
```

### Subject Collection
```javascript
{
  userId: 1,
  subject: 1  // Compound index for user's subjects
}
```

### Topic Collection
```javascript
{
  userId: 1,
  subjectId: 1  // Compound index for user's topics in a subject
},
{
  subjectId: 1  // Single index for subject's topics
}
```

## Query Patterns

### Fetching User with All Data
```javascript
// 1. Get user
const user = await User.findOne({ usn: "XXX" });

// 2. Get subjects
const subjects = await Subject.find({ userId: user._id });

// 3. Get topics for each subject
const topics = await Topic.find({ subjectId: subject._id });
```

### Creating New Topic
```javascript
// 1. Find user
const user = await User.findOne({ usn: "XXX" });

// 2. Find subject
const subject = await Subject.findOne({ 
  userId: user._id, 
  subject: "SubjectName" 
});

// 3. Create topic
await Topic.create({
  userId: user._id,
  subjectId: subject._id,
  topic: "TopicName",
  content: "...",
  images: []
});
```

### Deleting Subject (Cascade)
```javascript
// 1. Find subject
const subject = await Subject.findOne({ 
  userId: user._id, 
  subject: "SubjectName" 
});

// 2. Delete all topics
await Topic.deleteMany({ subjectId: subject._id });

// 3. Delete subject
await Subject.deleteOne({ _id: subject._id });
```

## API Response Format

### Maintaining Backward Compatibility

The API responses maintain the same nested structure as before:

```javascript
// Response format (same as before)
{
  _id: "userId",
  name: "User Name",
  usn: "USN123",
  subjects: [
    {
      _id: "subjectId",
      subject: "Subject Name",
      public: true,
      topics: [
        {
          _id: "topicId",
          topic: "Topic Name",
          content: "Content...",
          images: ["url1", "url2"],
          public: true,
          timestamp: "2025-12-10T..."
        }
      ]
    }
  ]
}
```

This is achieved by aggregating data from multiple collections in the API layer.

## Migration Strategy

### Migration Algorithm

```
FOR each work in Works collection:
  1. Check if user exists in Users collection
     - If not, create user with work data
     - If yes, skip user creation
  
  2. FOR each subject in work.subjects:
     - Create new subject document
     - Link to user via userId
     
     3. FOR each topic in subject.topics:
        - Create new topic document
        - Link to both user and subject
```

### Migration Idempotency

The migration is idempotent because:
1. Users are checked before creation (by USN)
2. Subjects and topics are always created (allows re-sync)
3. No data from Work collection is modified

## Performance Considerations

### Query Optimization

1. **Indexed Lookups**: All foreign key lookups use indexed fields
2. **Batch Operations**: Using `Promise.all()` for parallel queries
3. **Lean Queries**: Using `.lean()` for read-only operations
4. **Selective Fields**: Using `.select()` to fetch only needed fields

### Potential Bottlenecks

1. **Multiple Queries**: Fetching user with subjects and topics requires multiple queries
   - Mitigation: Can use aggregation pipeline if needed
   
2. **Cascading Deletes**: Deleting subjects requires additional topic deletion
   - Mitigation: Using `deleteMany()` for bulk operations

### Scalability Improvements

Compared to embedded documents:
- ✅ Better query performance for individual entities
- ✅ Easier to add indexes on specific fields
- ✅ More efficient updates (no need to update entire document)
- ✅ Supports future features (e.g., topic sharing between users)

## Security Considerations

### Data Access Control

1. **User Isolation**: All queries filter by `userId` to ensure users only access their data
2. **Public/Private Flags**: Subjects and topics have visibility controls
3. **Authentication**: All endpoints check authentication before data access

### Data Integrity

1. **Foreign Key Constraints**: MongoDB ObjectId references ensure referential integrity
2. **Required Fields**: Models define required fields to prevent incomplete data
3. **Validation**: Mongoose validation on all models

## Monitoring and Maintenance

### Health Checks

```bash
# Check collection counts
GET /api/migrate

# Response:
{
  "success": true,
  "counts": {
    "works": 100,
    "users": 100,
    "subjects": 500,
    "topics": 5000
  }
}
```

### Performance Monitoring

Key metrics to monitor:
1. Query response times
2. Database index usage
3. Collection growth rates
4. Connection pool utilization

## Future Enhancements

### Potential Improvements

1. **Aggregation Pipeline**: Use MongoDB aggregation for complex queries
2. **Caching Layer**: Add Redis for frequently accessed data
3. **Read Replicas**: Scale reads with MongoDB replica sets
4. **Sharding**: Partition data by userId for horizontal scaling

### Schema Evolution

The normalized structure makes it easier to:
- Add new fields to individual collections
- Create new relationships (e.g., user groups, topic tags)
- Implement features like topic sharing or collaboration

## Rollback Strategy

If issues arise, rollback is simple:
1. All original data exists in Work collection
2. Update API endpoints to use Work model again
3. Drop new collections if needed

```javascript
// Emergency rollback (if needed)
// 1. Restore old API imports
import Work from "@/models/Work";  // Instead of User/Subject/Topic

// 2. Revert query logic to use Work collection
const user = await Work.findOne({ usn });
```

## Testing Strategy

### Unit Tests
- Test individual model CRUD operations
- Test foreign key relationships
- Test cascade deletes

### Integration Tests
- Test migration endpoint
- Test API endpoints with new collections
- Test backward compatibility

### Performance Tests
- Benchmark query times
- Test with large datasets
- Compare with old embedded model

## Conclusion

The normalized database structure provides:
- ✅ Better scalability and performance
- ✅ Easier maintenance and evolution
- ✅ Improved data integrity
- ✅ Zero impact on existing frontend code

---

**Architecture Version**: 2.0
**Last Updated**: December 10, 2025
**Status**: Production Ready
