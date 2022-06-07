const {ClarifaiStub, grpc} = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();

const yourKey = "103c0f8511d84e1fb8427c579b2e8fb3"
const yourID = "popoder"
const yourApp = "facedetector123"

// Changes!!!
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + yourKey);

const handleApiCall = (req, res) => {
    stub.PostModelOutputs(
        {
            user_app_id: {
                "user_id": yourID,
                "app_id": yourApp
            },
            // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
            model_id: "face-detection",
            version_id: "45fb9a671625463fa646c3523a3087d5",
            inputs: [{data: {image: {url: req.body.input}}}]
        },
        metadata,
        (err, response) => {
            if (err) {
                console.log("Error: " + err);
                return;
            }

            if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
                return;
            }

            console.log("Predicted concepts, with confidence values:")
            for (const c of response.outputs[0].data.concepts) {
                console.log(c.name + ": " + c.value);
            }
            res.json(response)
        }
    );
}

const handleImage = (req, res, db) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
      // If you are using knex.js version 1.0.0 or higher this now returns an array of objects. Therefore, the code goes from:
      // entries[0] --> this used to return the entries
      // TO
      // entries[0].entries --> this now returns the entries
      res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'))
  }
  



module.exports = {
  handleImage,
  handleApiCall
}