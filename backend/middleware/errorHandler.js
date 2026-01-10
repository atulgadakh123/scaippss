// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const message = err.errors.map((error) => error.message).join(", ");
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.errors.map((error) => ({
        field: error.path,
        message: error.message,
        value: error.value,
      })),
    });
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const message = "Duplicate field value entered";
    return res.status(400).json({
      success: false,
      message,
      errors: err.errors.map((error) => ({
        field: error.path,
        message: `${error.path} must be unique`,
        value: error.value,
      })),
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    const message = "Invalid reference to related record";
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Sequelize database connection error
  if (
    err.name === "SequelizeConnectionError" ||
    err.name === "SequelizeConnectionRefusedError"
  ) {
    const message = "Database connection error";
    return res.status(500).json({
      success: false,
      message,
    });
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    return res.status(401).json({
      success: false,
      message,
    });
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    return res.status(401).json({
      success: false,
      message,
    });
  }

  // Multer error
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large";
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Default to 500 server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
  });
};

export { errorHandler };

// // Error handler middleware
// const errorHandler = (err, req, res, next) => {
//   let error = { ...err };
//   error.message = err.message;

//   // Log error
//   console.error(err);

//   // Sequelize validation error
//   if (err.name === "SequelizeValidationError") {
//     const message = err.errors.map((error) => error.message).join(", ");
//     return res.status(400).json({
//       success: false,
//       message: "Validation Error",
//       errors: err.errors.map((error) => ({
//         field: error.path,
//         message: error.message,
//         value: error.value,
//       })),
//     });
//   }

//   // Sequelize unique constraint error
//   if (err.name === "SequelizeUniqueConstraintError") {
//     const message = "Duplicate field value entered";
//     return res.status(400).json({
//       success: false,
//       message,
//       errors: err.errors.map((error) => ({
//         field: error.path,
//         message: `${error.path} must be unique`,
//         value: error.value,
//       })),
//     });
//   }

//   // Sequelize foreign key constraint error
//   if (err.name === "SequelizeForeignKeyConstraintError") {
//     const message = "Invalid reference to related record";
//     return res.status(400).json({
//       success: false,
//       message,
//     });
//   }

//   // Sequelize database connection error
//   if (
//     err.name === "SequelizeConnectionError" ||
//     err.name === "SequelizeConnectionRefusedError"
//   ) {
//     const message = "Database connection error";
//     return res.status(500).json({
//       success: false,
//       message,
//     });
//   }

//   // JWT error
//   if (err.name === "JsonWebTokenError") {
//     const message = "Invalid token";
//     return res.status(401).json({
//       success: false,
//       message,
//     });
//   }

//   // JWT expired error
//   if (err.name === "TokenExpiredError") {
//     const message = "Token expired";
//     return res.status(401).json({
//       success: false,
//       message,
//     });
//   }

//   // Multer error
//   if (err.code === "LIMIT_FILE_SIZE") {
//     const message = "File too large";
//     return res.status(400).json({
//       success: false,
//       message,
//     });
//   }

//   // Default to 500 server error
//   res.status(error.statusCode || 500).json({
//     success: false,
//     message: error.message || "Server Error",
//   });
// };

// module.exports = {
//   errorHandler,
// };
