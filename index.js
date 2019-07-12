require("dotenv").config();


const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const Person = require("./models/person.js");

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("build"));

morgan.token("body", (req, res) => {
  if (req.method === "POST") {
    return JSON.stringify(req.body);
  }

  return "";
});

app.use(
  morgan(":method :url :status :res[content-length] " 
         + "- :response-time ms :body")
);

app.get("/info", (req, res) => {
  Person
    .find({})
    .then(result => {
      res.send(`<div>Phonebook has info for ${result.length} people
                <p>${new Date()}</p></div>`)
    })
    .catch(error => next(error));
});

app.get("/api/persons", (req, res, next) => {
  Person
    .find({})
    .then(persons => res.json(persons.map(person => person.toJSON())))
    .catch(error => next(error));
});

app.get("/api/persons/:id", (req, res, next) => {
  Person
    .findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person.toJSON());
      } else {
        res.status(404).end();
      }
    })
    .catch(error => next(error));
});

app.post("/api/persons", (req, res, next) => {
  const body = req.body;

  const person = new Person({
    name: body.name,
    number: body.number
  });

  person
    .save()
    .then(savedPerson => res.json(savedPerson.toJSON()))
    .catch(error => next(error));
});

app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body;

  const person = {
    name: body.name,
    number: body.number
  };

  Person
    .findByIdAndUpdate(req.params.id, person, {
      new: true,
      runValidators: true,
      context: "query"
    })
    .then(updatedPerson => res.json(updatedPerson.toJSON()))
    .catch(error => next(error));
});

app.delete("/api/persons/:id", (req, res, next) => {
  Person
    .findByIdAndRemove(req.params.id)
    .then(result => res.status(204).end())
    .catch(error => next(error));
});

const errorHandler = (error, req, res, next) => {
  if (error.name === "CastError" && error.kind == "ObjectId") {
    return res.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  } else if (error.name === "TypeError") {
    return res.status(404).json({ error: "Something happened" });
  }

  next(error);
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

app.use(errorHandler);
app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
