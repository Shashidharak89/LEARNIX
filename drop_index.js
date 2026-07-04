import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://learnixp:LearnShare123@cluster0.3xqe1wb.mongodb.net/learnix?retryWrites=true&w=majority&appName=Cluster0";

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    
    const collection = db.collection('qpbatches');
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);
    
    try {
        await collection.dropIndex("year_1");
        console.log("Dropped year_1 index successfully.");
    } catch (e) {
        console.log("Error dropping year_1 index:", e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dropIndex();
