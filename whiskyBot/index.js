const path = require('path')
const {
    Telegraf,
    Markup
} = require('telegraf');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
require('dotenv').config();
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
    id: 0,
    orderid: 0,
    addBottleUsers: [],
    bottles: []
}).write();

const errorStr = 'Du musst mit mir erst eine private Konversation starten.';

const bot = new Telegraf(process.env.BOT_TOKEN);

const express = require('express');
const app = express();

function getButtons(_bottleid) {
    let bottle = db.get('bottles').find({
        bottleid: _bottleid
    }).value();

    let buttons = [
        []
    ];
    let count = 0;
    let index = 0;
    //7 sample sizes
    for (var i = 0; i < 7; i++) {
        if (bottle.boolArr[i]) {
            if (count == 4) {
                index++;
                buttons.push([]);
            }
            switch (i) {
                case 0:
                    buttons[index].push(Markup.callbackButton(`1cl ${bottle.sample1cl}€`, 'want_1cl'));
                    break;
                case 1:
                    buttons[index].push(Markup.callbackButton(`2cl ${bottle.sample2cl}€`, 'want_2cl'));
                    break;
                case 2:
                    buttons[index].push(Markup.callbackButton(`3cl ${bottle.sample3cl}€`, 'want_3cl'));
                    break;
                case 3:
                    buttons[index].push(Markup.callbackButton(`4cl ${bottle.sample4cl}€`, 'want_4cl'));
                    break;
                case 4:
                    buttons[index].push(Markup.callbackButton(`5cl ${bottle.sample5cl}€`, 'want_5cl'));
                    break;
                case 5:
                    buttons[index].push(Markup.callbackButton(`10cl ${bottle.sample10cl}€`, 'want_10cl'));
                    break;
                case 6:
                    buttons[index].push(Markup.callbackButton(`20cl ${bottle.sample20cl}€`, 'want_20cl'));
                    break;
            }
            count++;
        }
    }
    buttons[index].push(Markup.callbackButton('❌', 'remove'));
    return Markup.inlineKeyboard(buttons);
}

function getSampleButtons(boolArr) {
    return Markup.inlineKeyboard([
        [
            Markup.callbackButton('1cl' + ((boolArr[0]) ? '✔' : ''), 'add1cl'),
            Markup.callbackButton('2cl' + ((boolArr[1]) ? '✔' : ''), 'add2cl'),
            Markup.callbackButton('3cl' + ((boolArr[2]) ? '✔' : ''), 'add3cl'),
            Markup.callbackButton('4cl' + ((boolArr[3]) ? '✔' : ''), 'add4cl'),
            Markup.callbackButton('5cl' + ((boolArr[4]) ? '✔' : ''), 'add5cl'),
            Markup.callbackButton('10cl' + ((boolArr[5]) ? '✔' : ''), 'add10cl'),
            Markup.callbackButton('20cl' + ((boolArr[6]) ? '✔' : ''), 'add20cl')
        ]
    ]);
}

function getSamplePrice(bottle, sampleSize) {
    let bottlePrice = parseFloat(bottle.price);
    let bottleVolume = parseFloat(bottle.volume);
    let price = (((bottlePrice / bottleVolume) * sampleSize) + 1);
    price = price.toFixed(2);
    console.log(price);
    return price;
}

function getID() {
    let _id = db.get('id').value();
    db.update('id', n => n + 1).write();
    return _id;
}
function getNextOrderId(){
    let _orderid = db.get('orderid').value();
    db.update('orderid', n => n + 1).write();
    return _orderid;
}

function getBottleString(_bottleid) {
    let bottle = db.get('bottles').find({
        bottleid: _bottleid
    }).value();

    let str = `Neue Flasche 🍾:
Name: ${bottle.name}
Beschreibung: ${bottle.desc}
Füllstand: ${bottle.level} cl
----------------------------\n`;

    for (var i = 0; i < bottle.users.length; i++) {
        str += `${bottle.users[i].name}: ${bottle.users[i].amount} cl\n`
    }
    return str;
}

function extractFromBottle(_bottleid, amount) {
    db.get('bottles').find({
        bottleid: _bottleid
    }).update('level', n => parseInt(n) - amount).write()
}

function canExtract(_bottleid, amount) {
    let bottle = db.get('bottles').find({
        bottleid: _bottleid
    }).value()

    return parseInt(bottle.level) >= amount
}

function getPrice(_bottleid, amount){
    let bottle = db.get('bottles').find({
        bottleid: _bottleid
    }).value()
    let str = "sample" + amount + "cl"
    return bottle[str] || -1
}

function updateBottleInTelegram(_bottleid){
    var bottle = db.get('bottles').find({bottleid: _bottleid}).value()
    var _chatid = bottle.chatid
    var _msgid = bottle.msgid

    bot.telegram.editMessageText(_chatid, _msgid, null, getBottleString(_bottleid), {
        reply_markup: getButtons(_bottleid)
    });
}


bot.command('help', (ctx) => {
    ctx.reply(`Flasche hinzufügen /add\nVorgang beenden /stopBottle\nBot entfernen /quit`);
});

bot.command('quit', (ctx) => {
    ctx.telegram.leaveChat(ctx.message.chat.id);
});

bot.command('add', (ctx) => {
    var userid = ctx.message.from.id;
    var _chatid = ctx.message.chat.id;

    if (db.get('addBottleUsers').find({
            id: userid
        }).value()) {
        try {
            //error already adding a bottle
            ctx.telegram.sendMessage(userid, 'Du kannst nicht mehrere Flaschen auf einmal hinzufügen. Sende /stopBottle um deinen Vorgang zu unterbrechen.');
        } catch (error) {
            ctx.reply(errorStr);
        }
    } else {
        //add user to addBottleUsers and start private conversation
        db.get('addBottleUsers').push({
            id: userid,
            chatid: _chatid,
            stage: 0,
            bottle: {
                bottleid: getID(),
                chatid: _chatid,
                users: [],
                boolArr: [false, false, false, false, false, false, false]
            }
        }).write();
        try {
            ctx.telegram.sendMessage(userid, 'Name der Flasche: ');
        } catch (error) {
            ctx.reply(errorStr);
        }
    }
});
bot.command('stopBottle', (ctx) => {
    var userid = ctx.message.from.id;
    if (db.get('addBottleUsers').find({
            id: userid
        }).value()) {
        db.get('addBottleUsers').remove({
            id: userid
        }).write();
        ctx.telegram.sendMessage(userid, 'Dein Vorgang wurde gestoppt');
    }
});

bot.on('text', (ctx) => {
    var userid = ctx.message.from.id;
    //if user is adding a bottle
    if (db.get('addBottleUsers').find({
            id: userid
        }).value()) {
        //get stage
        var entry = db.get('addBottleUsers').find({
            id: userid
        }).value();
        var stage = entry.stage;
        var msg = ctx.message.text;
        switch (stage) {
            //name of the bottle
            case 0:
                db.get('addBottleUsers').find({
                    id: userid
                }).set('bottle.name', msg).write();
                ctx.telegram.sendMessage(userid, 'Beschreibung der Flasche: ');
                db.get('addBottleUsers').find({
                    id: userid
                }).update('stage', n => n + 1).write();
                break;
                //description of the bottle
            case 1:
                db.get('addBottleUsers').find({
                    id: userid
                }).set('bottle.desc', msg).write();
                //ctx.telegram.sendMessage(userid, 'Samplegrößen:', {reply_markup: samplebuttons});
                ctx.telegram.sendMessage(userid, 'Volumen der Flasche in cl: ');
                db.get('addBottleUsers').find({
                    id: userid
                }).update('stage', n => n + 1).write();
                break;
                //volume of bottle
            case 2:
                db.get('addBottleUsers').find({
                    id: userid
                }).set('bottle.volume', msg).write();
                ctx.telegram.sendMessage(userid, 'Füllstand der Flasche in cl: ');
                db.get('addBottleUsers').find({
                    id: userid
                }).update('stage', n => n + 1).write();
                break;
                //level of bottle
            case 3:
                db.get('addBottleUsers').find({
                    id: userid
                }).set('bottle.level', msg).write();
                ctx.telegram.sendMessage(userid, 'Preis der Flasche: ');
                db.get('addBottleUsers').find({
                    id: userid
                }).update('stage', n => n + 1).write();
                break;
                //price of bottle
            case 4:
                db.get('addBottleUsers').find({
                    id: userid
                }).set('bottle.price', msg).write();
                ctx.telegram.sendMessage(userid, 'Samplegrößen: ', {
                    reply_markup: getSampleButtons(entry.bottle.boolArr)
                });
                ctx.telegram.sendMessage(userid, `Um den Vorgang abzuschließen sende eine Nachricht.`);
                db.get('addBottleUsers').find({
                    id: userid
                }).update('stage', n => n + 1).write();
                break;
            case 5:
                ctx.telegram.sendMessage(userid, 'Die Flasche wurde hinzugefügt.! 👍');
                var bottle = db.get('addBottleUsers').find({
                    id: userid
                }).value().bottle;
                bottle.userid = userid; //add userid of bottle owner

                db.get('bottles').push(bottle).write();

                //send bottle information to group chat
                let _bottleid = bottle.bottleid;
                ctx.telegram.sendMessage(bottle.chatid, getBottleString(bottle.bottleid), {
                    reply_markup: getButtons(_bottleid)
                }).then((msg) => {
                    db.get('bottles').find({
                        bottleid: _bottleid
                    }).set('msgid', msg.message_id).write();
                });


                db.get('addBottleUsers').remove({
                    id: userid
                }).write();
                break;
        }
    }
});

async function want(ctx, amount) {
    let _msgid = ctx.update.callback_query.message.message_id;
    let bottle = db.get('bottles').find({
        msgid: _msgid
    }).value();
    let _bottleid = bottle.bottleid;
    let _chatid = bottle.chatid;

    let username = ctx.update.callback_query.from.username;
    let firstname = ctx.update.callback_query.from.first_name;
    let lastname = ctx.update.callback_query.from.last_name;
    let id = ctx.update.callback_query.from.id;

    let name = '';
    if (firstname) {
        name = firstname;
        if (lastname) {
            name += ' ' + lastname;
        }
    } else if (username) {
        name = username;
    } else {
        name = ctx.update.callback_query.from.id;
    }

    if (canExtract(_bottleid, amount)) {
        //subtract 
        extractFromBottle(_bottleid, amount);
        db.get('bottles').find({
            bottleid: _bottleid
        }).get('users').push({
            name: name,
            amount: amount,
            price: getPrice(_bottleid, amount),
            bottleid: _bottleid,
            userid: id,
            orderid: getNextOrderId()
        }).write();
        ctx.telegram.editMessageText(_chatid, _msgid, null, getBottleString(_bottleid), {
            reply_markup: getButtons(_bottleid)
        });

        let curbottle = db.get('bottles').find({
            bottleid: _bottleid
        }).value();
        if (curbottle.level <= 0) {
            ctx.telegram.sendMessage(curbottle.userid, `Die Flasche ${curbottle.name} ist leer.`);
        }
    } else {
        ctx.reply(`Der Füllstand der Flasche ist zu gering.`);
    }
    try {
        await ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
    }
}

bot.action('want_1cl', (ctx) => want(ctx, 1));
bot.action('want_2cl', (ctx) => want(ctx, 2));
bot.action('want_3cl', (ctx) => want(ctx, 3));
bot.action('want_4cl', (ctx) => want(ctx, 4));
bot.action('want_5cl', (ctx) => want(ctx, 5));
bot.action('want_10cl', (ctx) => want(ctx, 10));
bot.action('want_20cl', (ctx) => want(ctx, 20));

bot.action('remove', async (ctx) => {
    let _msgid = ctx.update.callback_query.message.message_id
    let bottle = db.get('bottles').find({
        msgid: _msgid
    }).value();
    let _bottleid = bottle.bottleid;
    let _chatid = bottle.chatid;

    if (ctx.update.callback_query.from.id != bottle.userid) {
        try {
            await ctx.answerCbQuery();
        } catch (error) {
            console.log(error);
        }
        return;
    }

    ctx.telegram.deleteMessage(_chatid, _msgid);
    db.get('bottles').remove({
        bottleid: _bottleid
    }).write();

    let firstname = ctx.update.callback_query.from.first_name;
    let lastname = ctx.update.callback_query.from.last_name;
    let username = ctx.update.callback_query.from.username;

    let name = '';
    if (firstname) {
        name = firstname;
        if (lastname) {
            name += ' ' + lastname;
        }
    } else if (username) {
        name = username;
    } else {
        name = ctx.update.callback_query.from.id;
    }
    ctx.reply(`${ctx.update.callback_query.from.first_name} hat die Flasche ${bottle.name} entfernt.`);
    try {
        await ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
    }
});

function applySample(index, _userid) {
    let boolArr = db.get('addBottleUsers').find({
        id: _userid
    }).value().bottle.boolArr;
    boolArr[index] = true;
    db.get('addBottleUsers').find({
        id: _userid
    }).set('bottle.boolArr', boolArr).write();
}

async function handleSampleRequest(ctx, size) {
    let _userid = ctx.update.callback_query.from.id;
    let bottle = db.get('addBottleUsers').find({
        id: _userid
    }).value().bottle;
    let _bottleid = bottle.bottleid;
    let _chatid = bottle.chatid;

    switch (size) {
        case 1:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample1cl', getSamplePrice(bottle, 1)).write();
            applySample(0, _userid);
            break;
        case 2:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample2cl', getSamplePrice(bottle, 2)).write();
            applySample(1, _userid);
            break;
        case 3:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample3cl', getSamplePrice(bottle, 3)).write();
            applySample(2, _userid);
            break;
        case 4:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample4cl', getSamplePrice(bottle, 4)).write();
            applySample(3, _userid);
            break;
        case 5:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample5cl', getSamplePrice(bottle, 5)).write();
            applySample(4, _userid);
            break;
        case 10:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample10cl', getSamplePrice(bottle, 10)).write();
            applySample(5, _userid);
            break;
        case 20:
            db.get('addBottleUsers').find({
                id: _userid
            }).set('bottle.sample20cl', getSamplePrice(bottle, 20)).write();
            applySample(6, _userid);
            break;
    }
    try {
        await ctx.answerCbQuery();
    } catch (error) {
        console.log(error);
    }
}

bot.action('add1cl', (ctx) => handleSampleRequest(ctx, 1));
bot.action('add2cl', (ctx) => handleSampleRequest(ctx, 2));
bot.action('add3cl', (ctx) => handleSampleRequest(ctx, 3));
bot.action('add4cl', (ctx) => handleSampleRequest(ctx, 4));
bot.action('add5cl', (ctx) => handleSampleRequest(ctx, 5));
bot.action('add10cl', (ctx) => handleSampleRequest(ctx, 10));
bot.action('add20cl', (ctx) => handleSampleRequest(ctx, 20));

bot.launch();

//#####################################################################
//                                API
//#####################################################################

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'db.json'));
});

//TODO: render in telegram chat
app.get('/order/delete/:bottleid/:orderid', (req, res) => {
    var _bottleid = parseInt(req.params.bottleid)
    var _orderid = parseInt(req.params.orderid)
    
    //can be imporved very much
    //will be improved after database change e.g. mongodb

    //remove order and reset level
    var order = db.get('bottles').find({bottleid: _bottleid}).get('users').find({orderid: _orderid}).value() 
    var amount = order.amount
    db.get('bottles').find({bottleid: _bottleid}).get('users').remove({orderid: _orderid}).write()
    db.get('bottles').find({bottleid: _bottleid}).update('level', level => level + amount).write()

    var bottlename = db.get('bottles').find({bottleid: _bottleid}).value().name
    bot.telegram.sendMessage(order.userid, `Deine Bestellung ${order.amount}cl für ${order.price}€ von der Flasche ${bottlename} wurde stoniert.`)

    updateBottleInTelegram(_bottleid)
    res.send(`200`)
})
app.get('/order/ok/:bottleid/:orderid', (req, res) => {
    var _bottleid = parseInt(req.params.bottleid)
    var _orderid = parseInt(req.params.orderid)

    //remove order but does not reset level 
    var order = db.get('bottles').find({bottleid: _bottleid}).get('users').find({orderid: _orderid}).value() 
    db.get('bottles').find({bottleid: _bottleid}).get('users').remove({orderid: _orderid}).write()

    var bottlename = db.get('bottles').find({bottleid: _bottleid}).value().name
    bot.telegram.sendMessage(order.userid, `Deine Bestellung ${order.amount}cl für ${order.price}€ von der Flasche ${bottlename} wurde abgeschlossen.`)

    updateBottleInTelegram(_bottleid)
    res.send(`200`)
})


//only allow requests form localhost
app.listen(3000, 'localhost', () => {
    console.log(`Bot api running on port 3000`);
});