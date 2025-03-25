import { config } from 'dotenv';
config({ path: '.env' });

import axios, { AxiosHeaders } from "axios"
import { Context } from "telegraf";
import helper from "../helper";

const request = async (ctx: Context, prop: any, query: string, bot_id: number): Promise<void> => {
    var attempts = Number(prop.get(`attempts_` + ctx.chat.id)) ?? 0;
    var urlEncoded = `${process.env.URL}?key=${process.env.KEY}`
    query = encodeURIComponent(query);
    var ops = {
        contents: [
            {
                parts: [{ text: query }],
            }
        ]
    }

    axios.post(urlEncoded, ops, {
        headers: {
            "Content-Type": "application/json"
        }
    }).then(async function (rest) {
        var result = rest.data.candidates[0].content.parts[0].text;
        if (!prop.get(`shutdown_` + bot_id)) {
            if (result.length < 2000) {
                if (ctx.chat.type == 'private') { ctx.replyWithMarkdownV2(helper.clearMarkdown(result)); } else { ctx.replyWithMarkdownV2(helper.clearMarkdown(result), { reply_parameters: { message_id: ctx.message.message_id } }); }
            } else {
                var tgh = await ctx.replyWithHTML(`⚠️ <b>Failed!</b>\nSending another message...`);
                var listMsg = process.env.LIST_MSG.split(',');
                var pick = listMsg[Math.floor(Math.random() * listMsg.length)];
                if (ctx.chat.type == 'private') { ctx.replyWithMarkdownV2(helper.clearMarkdown(pick)); } else { ctx.replyWithMarkdownV2(helper.clearMarkdown(pick), { reply_parameters: { message_id: ctx.message.message_id } }); }
                try { ctx.deleteMessage(tgh.message_id) } catch { }
            }
            prop.read(`calibrating_msgid_` + ctx.chat.id);
            prop.read(`attempts_` + ctx.chat.id);
        }
    }).catch(async function () {
        if (!prop.get(`shutdown_` + bot_id)) {
            setTimeout(() => { (!attempts) ? prop.set(`attempts_` + ctx.chat.id, 1) : prop.set(`attempts_` + ctx.chat.id, attempts + 1); request(ctx, prop, query, bot_id) }, 3000);
            if (attempts == 2) {
                var pesan = `⚠️ <b>Failed!</b>\nFailed to recalibrate, shutdown protocol is initiated! Bot are now offline.`
                try { ctx.deleteMessage(Number(prop.get(`calibrating_msgid_` + ctx.chat.id))) } catch { }
                ctx.replyWithHTML(pesan);
                helper.botStatus('off', bot_id, prop);
                prop.read(`calibrating_msgid_` + ctx.chat.id);
                prop.read(`attempts_` + ctx.chat.id);
                return;
            }
            if (attempts == 0) {
                var tgs = await ctx.replyWithHTML(`🔄 Recalibrating...`);
                prop.set('calibrating_msgid_' + ctx.chat.id, tgs.message_id);
            }
        }
    });
}

export default { request };