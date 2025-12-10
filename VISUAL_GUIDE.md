# Database Normalization - Visual Guide

## Before and After Comparison

### BEFORE: Embedded Document Model (Monolithic)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        WORK COLLECTION                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Document 1:
{
  _id: ObjectId("..."),
  name: "John Doe",
  usn: "ABC123",
  password: "hashed",
  profileimg: "url",
  subjects: [
    {
      _id: ObjectId("..."),
      subject: "Mathematics",
      public: true,
      topics: [
        {
          _id: ObjectId("..."),
          topic: "Algebra",
          content: "...",
          images: ["url1", "url2"],
          public: true,
          timestamp: ISODate("...")
        },
        {
          _id: ObjectId("..."),
          topic: "Calculus",
          content: "...",
          images: [],
          public: true,
          timestamp: ISODate("...")
        }
      ]
    },
    {
      _id: ObjectId("..."),
      subject: "Physics",
      public: true,
      topics: [...]
    }
  ],
  active: 10,
  createdAt: ISODate("...")
}

Problems:
❌ Large document size
❌ Difficult to query specific subjects/topics
❌ Inefficient updates
❌ Limited scalability
❌ Complex indexing
```

### AFTER: Normalized Collections (Relational)

```
┏━━━━━━━━━━━━━━━━━━━━┓
┃  USER COLLECTION    ┃
┗━━━━━━━━━━━━━━━━━━━━┛
{
  _id: ObjectId("user1"),
  name: "John Doe",
  usn: "ABC123",
  password: "hashed",
  profileimg: "url",
  active: 10,
  createdAt: ISODate("...")
}
         │
         │ One-to-Many
         ▼
┏━━━━━━━━━━━━━━━━━━━━┓
┃ SUBJECT COLLECTION  ┃
┗━━━━━━━━━━━━━━━━━━━━┛
{
  _id: ObjectId("subject1"),
  userId: ObjectId("user1"), ◄─── References User
  subject: "Mathematics",
  public: true,
  createdAt: ISODate("...")
}
{
  _id: ObjectId("subject2"),
  userId: ObjectId("user1"), ◄─── References User
  subject: "Physics",
  public: true,
  createdAt: ISODate("...")
}
         │
         │ One-to-Many
         ▼
┏━━━━━━━━━━━━━━━━━━━━┓
┃  TOPIC COLLECTION   ┃
┗━━━━━━━━━━━━━━━━━━━━┛
{
  _id: ObjectId("topic1"),
  userId: ObjectId("user1"),      ◄─── References User
  subjectId: ObjectId("subject1"), ◄─── References Subject
  topic: "Algebra",
  content: "...",
  images: ["url1", "url2"],
  public: true,
  timestamp: ISODate("...")
}
{
  _id: ObjectId("topic2"),
  userId: ObjectId("user1"),      ◄─── References User
  subjectId: ObjectId("subject1"), ◄─── References Subject
  topic: "Calculus",
  content: "...",
  images: [],
  public: true,
  timestamp: ISODate("...")
}
{
  _id: ObjectId("topic3"),
  userId: ObjectId("user1"),      ◄─── References User
  subjectId: ObjectId("subject2"), ◄─── References Subject
  topic: "Mechanics",
  content: "...",
  images: [],
  public: true,
  timestamp: ISODate("...")
}

Benefits:
✅ Smaller document sizes
✅ Efficient queries
✅ Easy updates
✅ Better scalability
✅ Flexible indexing
✅ Independent entity management
```

## Data Flow Comparison

### BEFORE: Single Collection Query

```
Client Request
     │
     ▼
┌────────────────────┐
│   API Endpoint     │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│  Work.findOne()    │  ◄─── Single query
└────────────────────┘
     │
     ▼
   Response
(Entire document with
 nested subjects and topics)
```

### AFTER: Multi-Collection Query

```
Client Request
     │
     ▼
┌────────────────────┐
│   API Endpoint     │
└────────────────────┘
     │
     ├────────────────────┬────────────────────┐
     ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│User.findOne()│  │Subject.find()│  │ Topic.find() │
└──────────────┘  └──────────────┘  └──────────────┘
     │                    │                    │
     └────────────────────┴────────────────────┘
                          │
                          ▼
                    Aggregate Data
                          │
                          ▼
                      Response
              (Same format as before)
```

## Migration Process Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            MIGRATION PROCESS                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Step 1: Fetch All Works
┌───────────────┐
│ Work.find({}) │
└───────────────┘
       │
       ▼
Step 2: Process Each Work
┌─────────────────────────────┐
│ For each work document:     │
│                             │
│ ┌─────────────────────────┐ │
│ │ 1. Extract User Data    │ │
│ │    └─> Create User      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 2. Extract Subjects     │ │
│ │    For each subject:    │ │
│ │    └─> Create Subject   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 3. Extract Topics       │ │
│ │    For each topic:      │ │
│ │    └─> Create Topic     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
       │
       ▼
Step 3: Return Statistics
┌─────────────────────┐
│ Migration Complete  │
│ - Users: 100        │
│ - Subjects: 500     │
│ - Topics: 5000      │
│ - Errors: 0         │
└─────────────────────┘
```

## API Response Transformation

### Example: GET /api/work/get?usn=ABC123

#### BEFORE (Direct from Work Collection)
```javascript
// Single query
const user = await Work.findOne({ usn: "ABC123" });

// Direct response
return NextResponse.json(user);
```

#### AFTER (Aggregate from Multiple Collections)
```javascript
// Step 1: Get user
const user = await User.findOne({ usn: "ABC123" });

// Step 2: Get subjects
const subjects = await Subject.find({ userId: user._id });

// Step 3: Get topics for each subject
const subjectsWithTopics = await Promise.all(
  subjects.map(async (subject) => {
    const topics = await Topic.find({ subjectId: subject._id });
    return { ...subject, topics };
  })
);

// Step 4: Build response (same format as before)
return NextResponse.json({
  ...user,
  subjects: subjectsWithTopics
});
```

## Index Strategy Visualization

### BEFORE: Limited Indexing
```
Work Collection Indexes:
- _id (default)
- usn (unique)

Problems:
❌ Can't efficiently query subjects
❌ Can't efficiently query topics
❌ No compound indexes
```

### AFTER: Optimized Indexing
```
User Collection Indexes:
├─ _id (default)
└─ usn (unique) ◄─── Fast user lookup

Subject Collection Indexes:
├─ _id (default)
└─ { userId: 1, subject: 1 } ◄─── Fast user's subjects lookup

Topic Collection Indexes:
├─ _id (default)
├─ { userId: 1, subjectId: 1 } ◄─── Fast user's topics lookup
└─ { subjectId: 1 } ◄─── Fast subject's topics lookup

Benefits:
✅ Efficient user queries
✅ Efficient subject queries
✅ Efficient topic queries
✅ Compound index optimization
```

## CRUD Operations Comparison

### CREATE Operation

#### BEFORE: Add Topic
```javascript
// 1. Find user document
const user = await Work.findOne({ usn });

// 2. Find subject in array
const subject = user.subjects.find(s => s.subject === "Math");

// 3. Push topic to nested array
subject.topics.push(newTopic);

// 4. Save entire document
await user.save(); // ❌ Updates entire document

// Problems:
// - Must load entire document
// - Must save entire document
// - Risk of concurrent update conflicts
```

#### AFTER: Add Topic
```javascript
// 1. Find user
const user = await User.findOne({ usn });

// 2. Find subject
const subject = await Subject.findOne({ userId: user._id, subject: "Math" });

// 3. Create topic
await Topic.create({
  userId: user._id,
  subjectId: subject._id,
  ...topicData
}); // ✅ Creates only topic document

// Benefits:
// - Only creates new document
// - No risk of conflicts
// - Faster operation
```

### DELETE Operation

#### BEFORE: Delete Subject
```javascript
// 1. Find user
const user = await Work.findOne({ usn });

// 2. Filter out subject
user.subjects = user.subjects.filter(s => s.subject !== "Math");

// 3. Save entire document
await user.save(); // ❌ Updates entire document

// Problems:
// - Must load and save entire document
// - Nested topics deleted implicitly
```

#### AFTER: Delete Subject
```javascript
// 1. Find subject
const subject = await Subject.findOne({ userId, subject: "Math" });

// 2. Delete related topics (cascade)
await Topic.deleteMany({ subjectId: subject._id }); // ✅ Explicit cascade

// 3. Delete subject
await Subject.deleteOne({ _id: subject._id }); // ✅ Only deletes subject

// Benefits:
// - Explicit cascade control
// - Efficient bulk operations
// - Clear data relationships
```

## Scalability Comparison

### BEFORE: Vertical Scaling

```
┌──────────────────────┐
│   Single Server      │
│  ┌────────────────┐  │
│  │ Work Collection│  │ ◄─── All data in one collection
│  │  (100 GB)      │  │
│  └────────────────┘  │
└──────────────────────┘

Limitations:
❌ Single point of failure
❌ Limited by server resources
❌ Difficult to optimize
```

### AFTER: Horizontal Scaling

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Server 1       │  │  Server 2       │  │  Server 3       │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │   Users     │ │  │ │  Subjects   │ │  │ │   Topics    │ │
│ │  (10 GB)    │ │  │ │  (30 GB)    │ │  │ │  (60 GB)    │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Benefits:
✅ Distributed load
✅ Independent scaling
✅ Better resource utilization
✅ Easier to optimize
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Collections | 1 | 3 |
| Document Size | Large | Small |
| Query Speed | Slower | Faster |
| Scalability | Vertical | Horizontal |
| Indexing | Limited | Optimized |
| Updates | Entire doc | Specific entity |
| Maintenance | Complex | Simple |
| Data Integrity | Implicit | Explicit |

---

**Transformation Status**: ✅ Complete
**Data Consistency**: ✅ Verified
**Performance**: ✅ Improved
**Scalability**: ✅ Enhanced
