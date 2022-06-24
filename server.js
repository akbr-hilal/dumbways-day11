const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const db = require("./database/db");
const app = express();
const port = 5000;

app.set("view engine", "hbs"); //Set hbs
app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
    session({
        secret: "admin",
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 2 * 60 * 60 * 1000,
        },
    })
);

db.connect(function (err, client, done) {
    if (err) throw err;
    console.log("Database connected....");

    // Render Home
    app.get("/", function (req, res) {
        client.query("SELECT * FROM tb_project", function (err, result) {
            if (err) throw err;

            let data = result.rows;
            let dataProject = data.map(function (items) {
                return {
                    ...items,
                    duration: getDistanceTime(
                        new Date(items.start_date),
                        new Date(items.end_date)
                    ),
                    isLogin: req.session.isLogin,
                };
            });
            console.log(dataProject);
            res.render("index", {
                projects: dataProject,
                user: req.session.user,
                isLogin: req.session.isLogin,
            });
        });
    });

    // Render Del Project
    app.get("/del-project/:id", function (req, res) {
        let delQuery = `DELETE FROM tb_project WHERE id = ${req.params.id}`;

        client.query(delQuery, function (err, result) {
            if (err) throw err;

            res.redirect("/");
        });
        done;
    });

    // Render Edit Project
    app.get("/edit-project/:id", function (req, res) {
        let id = req.params.id;
        console.log(id);

        client.query(
            `SELECT * FROM tb_project WHERE id=${id}`,
            function (err, result) {
                if (err) throw err;

                let data = result.rows[0];
                data = {
                    title: data.title,
                    image: data.image,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    nodeJs: data.technologis[0] !== "undefined",
                    reactJs: data.technologis[1] !== "undefined",
                    angularJs: data.technologis[2] !== "undefined",
                    laravel: data.technologis[3] !== "undefined",
                    description: data.description,
                };
                console.log(data);
                res.render("edit-project", {
                    data: data,
                    name: id,
                    user: req.session.user,
                    isLogin: req.session.isLogin,
                });
            }
        );
    });

    // Post Edit Project
    app.post("/edit-project/:id", function (req, res) {
        let id = req.params.id;
        let data = req.body;

        let updateData = `UPDATE tb_project
        SET title='${data.titleProject}', start_date='${data.startDateProject}', end_date='${data.endDateProject}', description='${data.descriptionProject}', technologis='{"${data.checkNodeJS}","${data.checkReactJS}","${data.checkAngularJS}","${data.checkLaravel}"}', image='${data.imageProject}'
        WHERE id=${id}`;

        client.query(updateData, (err, result) => {
            if (err) throw err;
            res.redirect("/");
        });
        done;
    });

    // Render Add Project
    app.get("/add-project", function (req, res) {
        res.render("add-project", {
            user: req.session.user,
            isLogin: req.session.isLogin,
        });
    });

    // Post Add Project
    app.post("/add-project", function (req, res) {
        let data = req.body;

        let node = req.body.checkNodeJS;
        let react = req.body.checkReactJS;
        let angular = req.body.checkAngularJS;
        let laravel = req.body.checkLaravel;

        let insertData = `INSERT INTO tb_project(title, start_date, end_date, description, technologis, image) VALUES ('${data.titleProject}', '${data.startDateProject}', '${data.endDateProject}', '${data.descriptionProject}', ARRAY ['${node}', '${react}', '${angular}', '${laravel}'], '${data.imageProject}')`;

        client.query(insertData, (err, result) => {
            if (err) throw err;
            res.redirect("/");
        });
        done;
    });

    // Render Project Detail
    app.get("/project-detail/:id", function (req, res) {
        let id = req.params.id;

        client.query(
            `SELECT * FROM tb_project WHERE id=${id}`,
            function (err, result) {
                if (err) throw err;

                let data = result.rows[0];

                data = {
                    title: data.title,
                    image: data.image,
                    start_date: getFullTime(new Date(data.start_date)) ,
                    end_date: getFullTime(new Date(data.end_date)),
                    duration: getDistanceTime(
                        new Date(data.start_date),
                        new Date(data.end_date)
                    ),
                    nodeJs: data.technologis[0] !== "undefined",
                    reactJs: data.technologis[1] !== "undefined",
                    angularJs: data.technologis[2] !== "undefined",
                    laravel: data.technologis[3] !== "undefined",
                    description: data.description,
                    image: data.image,
                };
                console.log(data);
                res.render("project-detail", {
                    data: data,
                    user: req.session.user,
                    isLogin: req.session.isLogin,
                });
            }
        );
    });

    // Render Contact
    app.get("/contact", function (req, res) {
        res.render("contact");
    });

    // Render Register
    app.get("/register", function (req, res) {
        res.render("register");
    });

    // Post Register
    app.post("/register", function (req, res) {
        let { inputName, inputEmail, inputPassword } = req.body;
        const hashedPassword = bcrypt.hashSync(inputPassword, 10);

        // View the same email
        const cekEmail = `SELECT * FROM tb_users WHERE email='${inputEmail}'`;
        client.query(cekEmail, function (err, result) {
            if (err) throw err;

            if (result.rows.length != 0) {
                req.flash("warning", "Email is already registered");
                return res.redirect("/register");
            }

            // Add Account
            const insertReq = `INSERT INTO tb_users (name, email, password) VALUES ('${inputName}', '${inputEmail}', '${hashedPassword}');`;
            client.query(insertReq, function (err, result) {
                if (err) throw err;
                res.redirect("/login");
            });
        });
        done;
    });

    // Render Login
    app.get("/login", function (req, res) {
        res.render("login");
    });

    // Post Login
    app.post("/login", function (req, res) {
        let { inputEmail, inputPassword } = req.body;

        let insertLog = `SELECT * FROM tb_users WHERE email='${inputEmail}'`;

        client.query(insertLog, function (err, result) {
            if (err) throw err;

            if (result.rows.length == 0) {
                req.flash("warningEmail", "Email not registered");
                return res.redirect("/login");
            }

            const isMatch = bcrypt.compareSync(
                inputPassword,
                result.rows[0].password
            );

            if (isMatch) {
                req.session.isLogin = true;
                req.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email,
                };

                req.flash("success", "Login success");
                res.redirect("/");
            } else {
                req.flash("warningPass", "Wrong password");
                res.redirect("login");
            }
        });
    });

    // Render Logout
    app.get("/logout", function (req, res) {
        req.session.destroy();

        res.redirect("/");
    });
});

function getFullTime(waktu) {
    let month = [
        "Januari",
        "Febuari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    let date = waktu.getDate();
    let monthIndex = waktu.getMonth();
    let year = waktu.getFullYear();

    let fullTime = `${date} ${month[monthIndex]} ${year}`;
    return fullTime;
}

function getDistanceTime(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let getTime = end - start;

    let distanceDay = Math.floor(getTime / (1000 * 3600 * 24));
    let distanceMonth = Math.floor(distanceDay / 31);

    duration =
        distanceMonth <= 0 ? distanceDay + " Hari" : distanceMonth + " Bulan";

    if (start > end) {
        flash("warning", "Error Your Date");
    } else if (start < end) {
        return `${duration}`;
    }
}

app.listen(port, function (req, res) {
    console.log(`Server berjalan di port ${port}`);
});
