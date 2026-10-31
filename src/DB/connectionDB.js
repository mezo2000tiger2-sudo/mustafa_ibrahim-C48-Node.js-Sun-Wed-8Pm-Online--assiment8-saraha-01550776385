import { DB_URI } from "../../config/config.service.js";

import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async (port , app) => {
    try {
        await mongoose.connect(DB_URI, {
        });

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