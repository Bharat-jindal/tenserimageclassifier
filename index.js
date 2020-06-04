const express = require('express');
const app = express();

const tf = require('@tensorflow/tfjs')
const tfcore = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs');
const formidable = require('formidable');
const bodyParser = require('body-parser');
const image = require('get-image-data');

app.use(bodyParser.json())

const server = require('http').Server(app);
const PORT = process.env.PORT || 80;

app.post("/image" , (req,res) => {
    let form = new formidable.IncomingForm({
        maxFileSize:10485760
    })

    form.parse(req, async(err,fields,files) => {
        if(err){
            console.log(err)
            res.status(500).send('Server Error')
        }
        else{
            whatIsThis(files.upload.path).then(imageclssification => {
                res.status(200).send({
                    classification:imageclssification
                })
            })
            .catch(err => {
                console.log('Errror')
                res.status(500).send('Error in classification')
            })
        }
    })
})

app.post('/image-from-url',(req,res) => {
    whatIsThis(req.body.url).then(imageclssification => {
        res.status(200).send({
            classification:imageclssification
        })
    })
    .catch(err => {
        console.log(err)
        res.status(500).send('Error in classification')
    })
})

function whatIsThis(url){
    return new Promise((resolve,reject) => {
        image(url , async (err,image) => {
            if(err){
                console.log(err)
                reject(err)
            }
            else{
                const channelCount = 3;
                const pixelCount = image.width*image.height;
                const vals = new Int32Array(pixelCount*channelCount);

                let pixels = image.data;

                for(let i=0;i<pixelCount;i++){
                    for(let j=0;j<channelCount;j++){
                        vals[i*channelCount + j] = pixels[i*4 +j]
                    }
                }

                const outputshape = [image.height , image.width , channelCount];
                const input = tf.tensor3d(vals,outputshape,"int32");
                const model = await mobilenet.load();
                const temp = await model.classify(input);
                resolve(temp)
            }
        })
    })
}

const path = require('path');
app.use(express.static(path.join(__dirname,'client/build')));

app.get('*',(req,res) => {
    res.sendFile("./client/build/index.html",{root:__dirname})
})


server.listen(PORT , (req,res) => {
    console.log('Server is running on port',PORT)
})
