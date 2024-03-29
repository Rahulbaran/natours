const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,difficulty,ratingsAverage,summary";
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res
      .status(200)
      .json({ status: "success", total: tours.length, data: { tours } });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: { tour }
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "success",
      message: "New tour has been created",
      data: { tour: newTour }
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "Invalid data sent!"
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: "success",
      data: {
        tour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      // { $sort: { ratingsQuantity: -1 } },
      // { $match: { $or: [{ difficulty: "easy" }, { difficulty: "medium" }] } },
      // {
      //   $group: {
      //     _id: null,
      //     numOfRatings: { $sum: "$ratingsQuantity" }
      //   }
      // }
      // { $count: "numOfRatings" }
      // { $match: { ratingAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          // _id: "$price",
          // _id: "$ratingAverage",
          avgRating: { $avg: "$ratingAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          maxDuration: { $max: "$duration" },
          maxRating: { $max: "$ratingAverage" },
          totalTours: { $sum: 1 },
          totalRatings: { $sum: "$ratingsQuantity" }
        }
      },
      { $sort: { avgRating: -1 } }
      // { $match: { _id: { $ne: "EASY" } } }
    ]);

    res.status(200).json({
      status: "success",
      data: stats
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: {
          path: "$startDates",
          includeArrayIndex: "arrayIndex",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          toursPerMonth: { $sum: 1 },
          tours: { $push: "$name" }
        }
      },
      { $addFields: { month: "$_id" } },
      { $project: { _id: 0 } },
      { $sort: { toursPerMonth: -1 } },
      { $limit: 3 }
    ]);

    res.status(200).json({ status: "success", data: { plan } });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error
    });
  }
};

// exports.getTourStats = async (req, res) => {
//   try {
//     const stats = await Tour.aggregate([
//       {
//         $match: { ratingAverage: { $gte: 4.5 } }
//       },
//       {
//         $group: {
//           // _id: "$price",
//           // _id: "$ratingAverage",
//           // _id: "$difficulty",
//           _id: { $toUpper: "$difficulty" },
//           numOfTours: { $sum: 1 },
//           numRatings: { $sum: "$ratingsQuantity" },
//           avgRating: { $avg: "$ratingAverage" },
//           avgPrice: { $avg: "$price" },
//           minPrice: { $min: "$price" },
//           maxPrice: { $max: "$price" }
//         }
//       },
//       {
//         $sort: { avgPrice: 1 }
//       }
//       // {
//       //   $count: "minPrice"
//       // },
//       // {
//       //   $match: { _id: "EASY" }
//       // }
//     ]);

//     res.status(200).json({ status: "success", data: { stats } });
//   } catch (error) {
//     res.status(404).json({
//       status: "fail",
//       message: error
//     });
//   }
// };

// exports.getMonthlyPlan = async (req, res) => {
//   try {
//     const year = +req.params.year;
//     const plan = await Tour.aggregate([{}]);

//     res.status(200).json({ status: "success", data: { plan } });
//   } catch (error) {
//     res.status(404).json({
//       status: "fail",
//       message: error
//     });
//   }
// };
