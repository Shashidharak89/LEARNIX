import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function POST(request) {
  try {
    await connectDB();

    // Fetch all works
    const works = await Work.find({});

    let usersCreated = 0;
    let subjectsCreated = 0;
    let topicsCreated = 0;
    const errors = [];

    for (const work of works) {
      try {
        // Check if user already exists
        let user = await User.findOne({ usn: work.usn });

        if (!user) {
          // Create user from work data
          user = await User.create({
            name: work.name,
            usn: work.usn,
            password: work.password,
            profileimg: work.profileimg,
            // preserve original creation timestamp from Work
            createdAt: work.createdAt || new Date()
          });
          usersCreated++;
        }

        // Process subjects for this user
        if (work.subjects && Array.isArray(work.subjects)) {
          for (const subjectData of work.subjects) {
            // Create subject for this user (even if another user has same subject name)
            const subject = await Subject.create({
              userId: user._id,
              subject: subjectData.subject,
              public: subjectData.public !== undefined ? subjectData.public : true,
              // preserve original subject creation if present
              createdAt: subjectData.createdAt || work.createdAt || new Date()
            });
            subjectsCreated++;

            // Process topics for this subject
            if (subjectData.topics && Array.isArray(subjectData.topics)) {
              for (const topicData of subjectData.topics) {
                // Create topic for this user and subject
                await Topic.create({
                  userId: user._id,
                  subjectId: subject._id,
                  topic: topicData.topic,
                  content: topicData.content || "",
                  images: topicData.images || [],
                  public: topicData.public !== undefined ? topicData.public : true,
                  // preserve original topic timestamp if present
                  timestamp: topicData.timestamp || subjectData.createdAt || work.createdAt || new Date()
                });
                topicsCreated++;
              }
            }
          }
        }
      } catch (error) {
        errors.push({
          usn: work.usn,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      stats: {
        totalWorks: works.length,
        usersCreated,
        subjectsCreated,
        topicsCreated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const usersCount = await User.countDocuments();
    const subjectsCount = await Subject.countDocuments();
    const topicsCount = await Topic.countDocuments();
    const worksCount = await Work.countDocuments();

    return NextResponse.json({
      success: true,
      counts: {
        works: worksCount,
        users: usersCount,
        subjects: subjectsCount,
        topics: topicsCount
      }
    });

  } catch (error) {
    console.error("Error fetching counts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
