import mongoose from "mongoose";
const SubscriberSchema=new mongoose.Schema({
    userid:{type:mongoose.Schema.Types.ObjectId},
    subscribers:{type:[mongoose.Schema.Types.ObjectId]},
});

export default mongoose.models.Subscriber || mongoose.model("Subscriber",SubscriberSchema);