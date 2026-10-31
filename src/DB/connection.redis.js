import { createClient } from "redis"
import { REDIS_URI } from "../../config/config.service.js";


export const redis_client = createClient({
  url: REDIS_URI,
  socket: {
    connectTimeout: 15000,
  },
});


const connectRedis = async () => {
    try {
        await redis_client.connect()

        console.log("Connected to Redis");
    }
    catch (error) {
        console.error("Error redis:", error);
    }
};

export default connectRedis;