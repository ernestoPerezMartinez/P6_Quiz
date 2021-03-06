const Sequelize = require("sequelize");
const {models} = require("../models");
const op = Sequelize.Op;




// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};



// GET /quizzes/randomplay

exports.randomplay = (req,res,next) =>{

    const {quiz, query} = req;  //implementamos autoload

    let empieza=0;  //contador inicio juego
    let acaba=5;
    let primera_bien=1;

    req.session.randomPlay = req.session.randomPlay || [];
    const whereOp = {id: {[op.notIn]: req.session.randomPlay}};  //buscamos quizzes y se lo añadimos a whereOp
    
    models.quiz.count({where:whereOp}) //contamos los quizzes de whereOP
    .then(count => {
        if(!count){  
            let score = req.session.randomPlay.length;
            req.session.randomPlay = []; 
            
            res.render('quizzes/random_nomore',{
                score: score
            });
        }
        
    let i=0; //contador
    let j=0;
    let reinicia=0;
    let aleatorio =  Math.floor(count*Math.random());  //buscamos quizzes aleatorios para no repetir
    return models.quiz.findAll({where: whereOp, offset:aleatorio, limit: 1})
        .then(quizzes => {
            return quizzes[0];
            });
    })
    .then(quiz =>{                      
        let score = req.session.randomPlay.length;     //Seguimos jugando. renderizaos a random_play y añadimos valores a quiz y a score
        res.render('quizzes/random_play',{
            quiz: quiz, 
            score: score}
            );
    })
    .catch(error => {  //caso en el que se produzcan errores
        next(error);
    });
};




// GET /quizzes/:quizId/randomcheck
exports.randomcheck =  (req, res, next) => {

    const {quiz, query} = req;  //implementamos autoload

    let i=0; //contador
    let j=0;
    let reinicia=0;

    let empieza=0; //contador inicio juego
    let acaba=5;
    let primera_bien=1;
    
    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim(); //comparamos si la respuesta dicha es igual a la respuesta que hay guardada en la bbdd
    const score = req.session.randomPlay.length + result; 
    
    if(result) {
        req.session.randomPlay.push(quiz.id);
    } 
    else {
        req.session.randomPlay = [];
    }
    
    res.render('quizzes/random_result', {  
        result,
        score,
        answer
    });
};