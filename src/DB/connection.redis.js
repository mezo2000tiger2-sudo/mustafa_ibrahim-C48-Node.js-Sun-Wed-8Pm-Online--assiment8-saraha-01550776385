import { createClient } from "redis"


export const redis_client = createClient({
  url: "rediss://default:gQAAAAAAApoKAAIgcDFlZTRjNmRhMDAxODM0YzQ5YTIyNWEwZGFlNDBkM2I2Zg@daring-yak-170506.upstash.io:6379"
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