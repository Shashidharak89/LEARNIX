const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://learnixp:LearnShare123@cluster0.3xqe1wb.mongodb.net/learnix?retryWrites=true&w=majority&appName=Cluster0";

// Define schemas
const SMUniversitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true }
}, { timestamps: true });

const SMCollegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "SMUniversity", required: true },
    location: { type: String, required: true }
}, { timestamps: true });

const SMCourseSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true });

const SMSemesterSchema = new mongoose.Schema({
    sem: { type: Number, required: true, unique: true }
}, { timestamps: true });

const SMBatchSchema = new mongoose.Schema({
    startyear: { type: Number, required: true },
    endyear: { type: Number, required: true }
}, { timestamps: true });

const SMSubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "SMCollege", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "SMCourse", required: true },
    sem: { type: mongoose.Schema.Types.ObjectId, ref: "SMSemester", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "SMBatch", required: true }
}, { timestamps: true, strictPopulate: false });

const SMFilesSchema = new mongoose.Schema({
    name: { type: String, required: false },
    fileurl: { type: String, required: true },
    sub: { type: mongoose.Schema.Types.ObjectId, ref: "SMSubject", required: true },
    type: { type: String, enum: ["default", "external"], default: "default" }
}, { timestamps: true, strictPopulate: false });

// Compile models
const SMUniversity = mongoose.models.SMUniversity || mongoose.model("SMUniversity", SMUniversitySchema, "smuniversities");
const SMCollege = mongoose.models.SMCollege || mongoose.model("SMCollege", SMCollegeSchema, "smcolleges");
const SMCourse = mongoose.models.SMCourse || mongoose.model("SMCourse", SMCourseSchema, "smcourses");
const SMSemester = mongoose.models.SMSemester || mongoose.model("SMSemester", SMSemesterSchema, "smsemesters");
const SMBatch = mongoose.models.SMBatch || mongoose.model("SMBatch", SMBatchSchema, "smbatches");
const SMSubject = mongoose.models.SMSubject || mongoose.model("SMSubject", SMSubjectSchema, "smsubjects");
const SMFiles = mongoose.models.SMFiles || mongoose.model("SMFiles", SMFilesSchema, "smfiles");

const seedData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        // Clear existing collections completely
        console.log("Purging all previous seeding records to start fresh...");
        await Promise.all([
            SMUniversity.deleteMany({}),
            SMCollege.deleteMany({}),
            SMCourse.deleteMany({}),
            SMSemester.deleteMany({}),
            SMBatch.deleteMany({}),
            SMSubject.deleteMany({}),
            SMFiles.deleteMany({})
        ]);
        console.log("Cleanup finished.");

        // 1. Seed University
        console.log("Seeding University...");
        await SMUniversity.create({
            _id: "6a4fad3ac363c88f06c41b81",
            name: "Nitte Deemed to be University",
            city: "Karkala",
            district: "Udupi"
        });

        // 2. Seed College
        console.log("Seeding College...");
        await SMCollege.create({
            _id: "6a4fad59c363c88f06c41b90",
            name: "NMAM Institute of Technology, Nitte",
            university: "6a4fad3ac363c88f06c41b81",
            location: "Nitte"
        });

        // 3. Seed Course
        console.log("Seeding Course...");
        await SMCourse.create({
            _id: "6a4fad62c363c88f06c41b97",
            name: "Master of Computer Applications"
        });

        // 4. Seed Semester
        console.log("Seeding Semester...");
        await SMSemester.create({
            _id: "6a4fad66c363c88f06c41b9d",
            sem: 1
        });

        // 5. Seed Batch
        console.log("Seeding Batch...");
        await SMBatch.create({
            _id: "6a4fada0c363c88f06c41bc4",
            startyear: 2025,
            endyear: 2027
        });

        // Subjects configuration
        const subjectsData = [
            {
                id: "6a4fb1d0269d6a57c19befdd",
                name: "Syllabus",
                files: [
                    { name: "Syllabus", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Syllabus/1stMCA-Syllabus.pdf" },
                    { name: "MCA Regulations Syllabus 2025", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Syllabus/22CMPA20D2_22CMPA14D3_MCA_%20Regulations_Syllabus%20_2025.01.pdf" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb3fcde817c57dad5ecd7",
                name: "Mathematics",
                files: [
                    { name: "Mathematics Textbook", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Mathematics/MATHS-TEXT-BOOK.pdf" },
                    { name: "VassXMSE1SEM1 262 Handwritten Notes", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Mathematics/VassXMSE1SEM1%262.pdf" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb409de817c57dad5ece7",
                name: "Data Communication and Networking",
                files: [
                    { name: "Unit 1 Ch1", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/unit2-ch1.pdf" },
                    { name: "Unit 1 DCN Question Bank", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/1.%20UNIT%201%20DCN%20QUESTION%20BANK.pdf" },
                    { name: "DCN Data Encoding", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/DCN-Data%20Encoding.pptx" },
                    { name: "DCN Protocol Architecture", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/DCN-protocol%20architecture.pptx" },
                    { name: "Data Communication and Networks Introduction", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/Data%20Communication%20and%20Networks-Introduction-final.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit1/App%20Layer-Unit2-Ch%202.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit2/App%20Layer-Unit2-Ch%202.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit2/unit2-ch1.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit2/1.%20UNIT%202%20DCN%20QUESTION%20BANK.pdf" },
                    { name: "U3 Transport-Layer-3rd-unit.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit3/transport-layer-3rd%20unit.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit3/unit%203-transport%20layer%20protocol-part%202.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit3/unit%203-transport%20layer-part%201.pdf" },
                    { name: "U4 Unit4 Modified.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit4/unit%204_modified.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit4/unit%204_Networklayer.pdf" },
                    { name: "U5 Congestion in Data Networks", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication/Unit5/Unit%205-CongestioninDataNetworks.pdf" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb414de817c57dad5ecef",
                name: "Data Communication and Networking Lab",
                files: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/25MCA108-DCN-lab%20manual.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/dcn-lab-ns2-wrkng-pgms.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/Assignment%201%20_Frame%20sort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/assignment_2%20error%20detection.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/cnbubble.c" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/cninsertion.c" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/cnquicksort.c" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/CRC_Program_Sep2025.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/a4prog1.c" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/Dijkstra%E2%80%99s%20Algorithm.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/Program7_Question_Dijkstra%E2%80%99s%20Algorithm.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/a8prog.c" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/Assignment%208.doc" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/program1.tcl" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/program2.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-And-Computer-Communication-Lab/CN%20assignment%203%20NS-2.pdf" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb420de817c57dad5ecff",
                name: "Research Methodology and Publication Ethics",
                files: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/RM_U1.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/RM_U2.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/RM_U3.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/RM_Unit_4.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/Unit4-plagiarism.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Research-Methodology-And-Publication-Ethics/Materials_Unit5.docx" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb42ade817c57dad5ed07",
                name: "Advanced Data Base Systems",
                files: [
                    { name: "ADBS Textbook", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/refs/heads/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS-Text-Book.pdf" },
                    { name: "ADBS Unit-1", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS_Unit%201_Intro%20to%20DB.pdf" },
                    { name: "ADBS Unit-2", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS_Unit%202_SQL.pdf" },
                    { name: "ADBS Unit-3", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS_Unit%203_MySQL.pdf" },
                    { name: "ADBS Unit-4", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS_Unit%204_Database%20Design.pdf" },
                    { name: "ADBS Unit-5", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS_Unit%205_MongoDB.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/MongoDB-Student-Projects(A-and-B-Sections).docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/ADBS%20Assignment(Task).docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/View%20constraint%20details.docx" }
                ],
                externalfiles: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems/adbs-unit3-custom-notes-shashidharak.pdf" }
                ]
            },
            {
                id: "6a4fb434de817c57dad5ed0f",
                name: "Advanced Data Base Systems Lab",
                files: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%201.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%202.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%203.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%204.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%205.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%206.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%207_MongoDB.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Assignment%20Related%20to%20Lab.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Data-Base-Systems-Lab/Sample%20SEE%20Lab%20QP.docx" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb43ede817c57dad5ed1f",
                name: "Advanced Operating System with Unix",
                files: [
                    { name: "AOS ch1", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/Aos%20ch1.pptx" },
                    { name: "AOS Ch2", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/AOS%20ch2.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/AOS%20ch2.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/Aos%20unit2.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/Aos%20unit3.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/Aos%20unit4.pptx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Advanced-Operating-System-with-Unix/Aos%20unit5.pptx" }
                ],
                externalfiles: []
            },
            {
                id: "6a4fb448de817c57dad5ed27",
                name: "Data Structures And Algorithms",
                files: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/Abstract_Data_Types.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/Arrays_in_C_Presentation.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/C%20structure%20Program%20simple.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/C%20structure%20Program%20using%20array%20of%20objects.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/C%20structure%20Program%20using%20nested%20structure%20concept.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/C_Functions_Presentation.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/Introduction%20to%20DS-edited.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/Introduction_to_DSA.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/Pointers.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%201/structures-edited.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20I/Chapter%202/Design%20and%20Analysis%20of%20Algorithms.pdf" },
                    { name: "U2 Doubly Linked lists", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20II/Doubly%20Linked%20Lists.pdf" },
                    { name: "Realization of DLL", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20II/Realization%20of%20DLL%20program.pdf" },
                    { name: "Realization if Singly Linked List", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20II/Realization%20of%20Singly%20Linked%20List-edited.pdf" },
                    { name: "Realization of SLL Program", url: "https://raw.githubusercontent.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20II/realization%20of%20SLL%20program.pdf" },
                    { name: "U3 Evaluate Postfix.c.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Evaluate%20Postfix.c.pdf" },
                    { name: "U3 Interger Stack realization.docx", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Interger%20Stack%20realization.docx" },
                    { name: "U3 Postfix_Evaluation.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Postfix_Evaluation.pdf" },
                    { name: "U3 Queues as Lists in C.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Queues%20as%20Lists%20in%20C.pdf" },
                    { name: "U3 Recursion.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Recursion.pdf" },
                    { name: "U3 Recursive Program for Fibonacci numbers in C.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Recursive%20Program%20for%20Fibonacci%20numbers%20in%20C.pdf" },
                    { name: "U3 Stack Data Structure.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Recursive%20Program%20for%20Fibonacci%20numbers%20in%20C.pdf" },
                    { name: "U3 Stack.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Stack.pdf" },
                    { name: "U3 Static student stack.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/Static%20student%20stack.pdf" },
                    { name: "U3 circular queue-student.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/circular%20queue-student.pdf" },
                    { name: "U3 circular queue.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/circular%20queue.pdf" },
                    { name: "U3 convert from infix to postfix-Algorithm.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/convert%20from%20infix%20to%20postfix-Algorithm.pdf" },
                    { name: "U3 convert infix to postfix.c.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/convert%20infix%20to%20postfix.c.pdf" },
                    { name: "U3 dynamic integer stack.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/dynamic%20integer%20stack.pdf" },
                    { name: "U3 ordinary queue- student.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/ordinary%20queue-%20student.pdf" },
                    { name: "U3 ordinary queue.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20III/ordinary%20queue.pdf" },
                    { name: "U4 BST.c.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/BST.c.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/Binary%20Tree%20Representations%20new.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/Implementation%20of%20Right-in%20threaded%20BT.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/TREES%20-%20Introduction.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/Threaded%20binary%20tree.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/Traversing%20a%20tree.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20IV/binary_search_tree.c.pdf" },
                    { name: "U5 Efficency of Quick Sort.pdf", url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Efficency%20of%20Quick%20Sort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Interpolation%20Search.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Searching%20an%20ordered%20table.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Searching-introduction.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Selection%20sort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Sequential%20searching.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Shell%20Sort%20Techniques.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Simple_insertionsort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Sorting%20-quick%20sort%20tracing-II.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Sorting%20-quick%20sort%20tracing.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/Sorting%20Techniques.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/binary%20search%20-%20introduction.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/mergesort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/quickSort.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/Unit%20V/recursive%20binary%20search.pdf" }
                ],
                externalfiles: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/External/DSA-FULL-NOTES.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms/External/DSA-QB-SOLVED.pdf" }
                ]
            },
            {
                id: "6a4fb454de817c57dad5ed2f",
                name: "Data Structures And Algorithms Lab",
                files: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/Fundamentals%20of%20Programming%20using%20C%20Lab%20Assignment.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA-ASSIGNMENT-QA.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-2.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-3.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-4.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-5.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-6.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA%20Lab%20Assignment-7.docx" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/DSA-ASSIGNMENT-QA.pdf" }
                ],
                externalfiles: [
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-Assignment-2.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-ASSIGNMENT-3.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-ASSIGNMENT-4.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-ASSIGNMENT-5.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-ASSIGNMENT-6.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/DSA-Assignment-7.pdf" },
                    { url: "https://raw.github.com/Shashidharak89/Study_Materials_Collection/main/MCA-NMAMIT/1st-Sem-2025-26/Data-Structures-And-Algorithms-Lab/External/part_B_programs%20DSA.pdf" }
                ]
            }
        ];

        // Seed Subjects and Files
        for (const subj of subjectsData) {
            console.log(`Upserting subject: ${subj.name}...`);
            await SMSubject.create({
                _id: subj.id,
                name: subj.name,
                college: "6a4fad59c363c88f06c41b90",
                course: "6a4fad62c363c88f06c41b97",
                sem: "6a4fad66c363c88f06c41b9d",
                batch: "6a4fada0c363c88f06c41bc4"
            });

            // Insert default files
            console.log(`Inserting ${subj.files.length} default files for ${subj.name}...`);
            for (const file of subj.files) {
                await SMFiles.create({
                    name: file.name || "",
                    fileurl: file.url,
                    sub: subj.id,
                    type: "default"
                });
            }

            // Insert external files
            if (subj.externalfiles && subj.externalfiles.length > 0) {
                console.log(`Inserting ${subj.externalfiles.length} external files for ${subj.name}...`);
                for (const file of subj.externalfiles) {
                    await SMFiles.create({
                        name: file.name || "",
                        fileurl: file.url,
                        sub: subj.id,
                        type: "external"
                    });
                }
            }
        }

        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Seeding failed:", e);
        process.exit(1);
    }
};

seedData();
