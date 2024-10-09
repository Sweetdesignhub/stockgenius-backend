// Configure AWS S3
// import AWS from 'aws-sdk';

// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID_INDIA,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_INDIA,
//     region: process.env.AWS_REGION_INDIA,
// });

// export default s3;



import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_INDIA,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_INDIA,
    },
    region: process.env.AWS_REGION_INDIA
});

export { s3Client };