require("dotenv").config();
const { exec } = require("child_process");

exec(
  'npx prisma migrate status --schema="d:\\Codes\\Internship\\Electrosoft\\Student_Alumni_Industry_Interconnection\\Backend\\prisma\\schema.prisma"',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  }
);
