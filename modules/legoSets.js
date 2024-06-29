require("dotenv").config();
const Sequelize = require("sequelize");

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust this based on your SSL requirements
      },
    },
    logging: false,
  }
);

// Define the Theme model
const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
  },
  {
    timestamps: false,
  }
);

// Define the Set model
const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
  },
  {
    timestamps: false,
  }
);

// Create associations
Set.belongsTo(Theme, { foreignKey: "theme_id" });

module.exports = {
  initialize: () => sequelize.sync(),
  getAllSets: () => Set.findAll({ include: [Theme] }),
  getSetByNum: (set_num) =>
    Set.findOne({ where: { set_num }, include: [Theme] }).then((set) => {
      if (set) {
        return set;
      } else {
        throw new Error("Unable to find requested set");
      }
    }),
  getSetsByTheme: (theme) =>
    Set.findAll({
      include: [
        {
          model: Theme,
          where: { name: { [Sequelize.Op.iLike]: `%${theme}%` } },
        },
      ],
    }).then((sets) => {
      if (sets.length > 0) {
        return sets;
      } else {
        throw new Error("Unable to find requested sets");
      }
    }),
  addSet: (setData) =>
    Set.create(setData).catch((err) => {
      console.error("Error adding set:", err); // Log the error for debugging
      throw new Error(err.errors ? err.errors[0].message : "Unknown error");
    }),
  getAllThemes: () => Theme.findAll(),
  editSet: (set_num, setData) =>
    Set.update(setData, { where: { set_num } }).then(([rowsUpdated]) => {
      if (rowsUpdated === 0) {
        throw new Error("Set not found");
      }
    }).catch((err) => {
      console.error("Error editing set:", err); // Log the error for debugging
      throw new Error(err.errors ? err.errors[0].message : "Unknown error");
    }),
  deleteSet: (set_num) =>
    Set.destroy({ where: { set_num } }).then((deleted) => {
      if (!deleted) {
        throw new Error("Set not found");
      }
    }).catch((err) => {
      console.error("Error deleting set:", err); // Log the error for debugging
      throw new Error(err.errors ? err.errors[0].message : "Unknown error");
    }),
};
