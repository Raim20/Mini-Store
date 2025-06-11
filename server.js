const express = require("express");
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const createPath = require("./server/create-path.js");
// const errorHandler = require("./server/middlewares/error-handler.js");

const app = express();

app.set("view engine", "ejs");

const port = process.env.port;

app.listen(port, (error) => {
    error ? console.log(error) : console.log(`listening port ${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.locals.helpers = {
        formatPrice(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        }
    };
    next();
});

app.use('/js', express.static(path.join(__dirname, "./client/js")));
app.use('/styles', express.static(path.join(__dirname, './client/styles')));
app.use('/resources', express.static(path.join(__dirname, './client/resources')));
app.use('/views', express.static(path.join(__dirname, './client/views')));

const productsPath = path.join(__dirname, "products.json");
const reviewsPath = path.join(__dirname, "reviews.json");
let products = [];
let reviews = [];

try {
    const productsFileContent = fs.readFileSync(productsPath, "utf-8");
    products = JSON.parse(productsFileContent);
} catch (error) {
    console.error("Ошибка чтения products.json:", error);
    process.exit(1);
}

try {
    const reviewsFileContent = fs.readFileSync(reviewsPath, "utf-8");
    reviews = JSON.parse(reviewsFileContent);
} catch (error) {
    console.error("Ошибка чтения reviews.json:", error);
    process.exit(1);
}

const commonRoutes = ["/", "/main", "/home"];
app.get(commonRoutes, async(req, res, next) => {
    try {
        const page = 1;
        const pageSize = 6;

        const total = products.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const items = products.slice(startIndex, endIndex);
        return res.render(createPath("./index"), {
            page,
            pageSize,
            total,
            items
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

app.get("/reviews", (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            reviews: reviews
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

app.get("/products", (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 6);

        const total = products.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const items = products.slice(startIndex, endIndex);
        return res.status(200).json({
            success: true,
            page,
            pageSize,
            total,
            items
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

app.post("/order", (req, res, next) => {
    try {
        const { phone, cart } = req.body;

        if (!phone) {
            return res.status(404).json({
                success: false,
                error: "отсутствуют номер телефона"
            });
        }

        if (!cart && cart.length === 0) {
            return res.status(404).json({
                success: false,
                error: "отсутствуют товарвы"
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

app.use((req, res) => {
    res.status(404).render(createPath(`./pages/errors/error-page-${404}`));
});