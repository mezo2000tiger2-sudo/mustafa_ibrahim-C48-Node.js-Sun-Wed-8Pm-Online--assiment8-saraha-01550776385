import mongoose from "mongoose";
// import dns from "dns";

// dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async (port , app) => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/saharah", {
        });
        // await mongoose.connect("mongodb+srv://mustafa:mezo362012@cluster0.38xmihw.mongodb.net/saharah", {
        // });
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
        console.log("Connected to MongoDB");

    }
    catch (error) {
        console.error("Error:", error);
    }
};

export default connectDb;