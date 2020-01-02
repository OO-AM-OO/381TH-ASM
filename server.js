const fs = require('fs');
const formidable = require('formidable');
const ExifImage = require('exif').ExifImage;
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use((req, res, next) => {
    if (req.path == "/upload" || req.path == "/info" || req.path == "/map") {
        next();
    } else{
        res.redirect('/upload');
    }
});

app.get("/upload", function (req, res) {
    let error = '';
    if (req.query.fail == 'exif') {
        error = 'Error: It do not have Makernote information!';
    } else if (req.query.fail == 'type') {
        error = "Please upload a supported format of image, such as JPEG,Tiff,PNG...";
    }res.render('upload', { error: error });
});


app.post("/info", function (req, res) {
    if (req.method.toLowerCase() == "post") {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
			let newpho = {};
            newpho['title'] = fields.title;
            newpho['description'] = fields.description;
            newpho['mimetype'] == files.choseFile.mimetype;
            var gps = true;
            fs.readFile(files.choseFile.path, (err, data) => {
                newpho['image'] = new Buffer.from(data).toString('base64');
                try {new ExifImage({ image: files.choseFile.path }, function (error, exifData) {
                        if (error) {
                            res.redirect('/upload?fail=exif');
                        } else{
                            newpho['make'] = exifData.image.Make;
                            newpho['model'] = exifData.image.Model;
                            newpho['created'] = exifData.exif.CreateDate;
							newpho['lat'] = getGps(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
                            newpho['lon'] = getGps(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
                            if (newpho.lat == '' || newpho.lon == '')
                                gps = false;
								res.render('info', { newpho: newpho, gps: gps });
                        }
                   });
                }catch (error) {
                    res.redirect('/upload?fail=exif');
                }
            });
        });
    }
});

app.get("/info", function (req, res) {res.redirect('/upload');});
app.get("/map", function (req, res) {res.render("map", { lat: req.query.lat, lon: req.query.lon });});

function getGps(gps, ref) {
    if (gps == null || ref == null) {
        return '';
    } else{
        let result = (gps[0] + (gps[1] / 60) + (gps[2] / 3600));
        if (ref == "S" || ref == "W") {
            result *= -1;
        }return result;
    }
}

app.listen(process.env.PORT || 8099);
