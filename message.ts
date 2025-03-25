import { config } from 'dotenv';
config({ path: '.env' });

import { Telegraf, Context } from "telegraf";
import { Message, Update } from "telegraf/types";
import { Request } from 'express';
import helper from "./components/helper/index";
import ai from './components/ai/index';
import { prop } from "./components/property";

export default async function telegram(token: string, req: Request, bot_id: number, admin_list: Array<string | number>): Promise<void> {
    const bot = new Telegraf(token);
    if (!prop.get(`webhook_` + bot_id)) {
        admin_list.forEach(function(id) {
            bot.telegram.sendMessage(id, '📡 <b>Connected!</b>\nSuccessfully connected to webhook.', { parse_mode: 'HTML' })
        });
        prop.set(`webhook_` + bot_id, 'true');
    }
    const getBotStatus = prop.get(`shutdown_` + bot_id);
    const getBotDate = prop.get(`bot_date_` + bot_id);
    var cck: any;

    bot.on("message", async (ctx: Context) => {
        try {
            var msg = ctx.message as Message.TextMessage | Message.NewChatMembersMessage | undefined;

            var pola = /^\/start$/i
            if (pola.exec("text" in msg && msg.text)) {
                var pesan = `Selamat datang ${helper.getName(msg)}! Kirim pesan apapun itu untuk memulai percakapan.`
                return ctx.reply(pesan);
            }

            if (admin_list.indexOf(String(msg.from.id)) != -1) {
                var pola = /^\/bot\s(.+)/i
                if (cck = pola.exec("text" in msg && msg.text)) {
                    var act = cck[1];

                    if (act == 'off') {
                        if (getBotStatus) return ctx.replyWithHTML(`⚠️ <b>Failed!</b>\nBot has been offline${(getBotDate) ? ` since ${getBotDate}` : `.`}`);

                        var tgs = await ctx.reply(`⏳ Initiating shutdown protocol...`);
                        helper.botStatus('off', bot_id, prop);
                        bot.telegram.editMessageText(msg.chat.id, tgs.message_id, null, `✅ <b>OK!</b>\nBot are now offline.`, { parse_mode: 'HTML' });
                    } else if (act == 'on' || act == 'restart') {
                        if (!getBotStatus && act == 'on') return ctx.replyWithHTML(`⚠️ <b>Failed!</b>\nBot has been online${(getBotDate) ? ` since ${getBotDate}` : `.`}`);
                        var msgs = (act == 'on') ? { m1: `⏳ Activating bot...`, m2: `✅ <b>OK!</b>\nBot are now online.` } : { m1: `⏳ Restarting bot...`, m2: `✅ <b>OK!</b>\nBot successfully restarted.` };

                        var tgs = await ctx.reply(msgs.m1);
                        helper.botStatus('on', bot_id, prop);
                        bot.telegram.editMessageText(msg.chat.id, tgs.message_id, null, msgs.m2, { parse_mode: 'HTML' });
                        ctx.reply(`Halo`);
                    }
                    return;
                }
            }

            if ("text" in msg && msg.text) {
                if (!getBotStatus) {
                    if (msg.text == 'hai' && ctx.from.id == 6800596558) return ctx.reply('Halo')

                    if (msg.chat.type != 'private') {
                        if (msg.reply_to_message && msg.reply_to_message.from.id == bot_id) {
                            ctx.sendChatAction('typing');
                            setTimeout(() => {
                                ctx.sendChatAction('typing');
                                ai.request(ctx, prop, "text" in msg && msg.text, bot_id);
                            }, 3000);
                        }
                    } else {
                        ctx.sendChatAction('typing');
                        setTimeout(() => {
                            ctx.sendChatAction('typing');
                            ai.request(ctx, prop, "text" in msg && msg.text, bot_id);
                        }, 3000);
                    }
                }
            }
        } catch {
            var tgh = await ctx.replyWithHTML(`⚠️ <b>Failed!</b>\nSending another message...`);
            var listMsg = process.env.LIST_MSG.split(',');
            var pick = listMsg[Math.floor(Math.random() * listMsg.length)];
            if (ctx.chat.type == 'private') { ctx.replyWithMarkdownV2(helper.clearMarkdown(pick)); } else { ctx.replyWithMarkdownV2(helper.clearMarkdown(pick), { reply_parameters: { message_id: ctx.message.message_id } }); }
            try { ctx.deleteMessage(tgh.message_id) } catch { }
        }

        if ("new_chat_members" in msg && msg.new_chat_members) {
            ctx.sendChatAction('typing');
            var pesans = ['Halo', 'Apa kabar kalian', 'apakah Anda baik-baik saja?'];
            var pick = msgs[Math.floor(Math.random() * pesans.length)];
            try { ctx.replyWithHTML(pick); } catch { }
            return;
        }
    });

    return await bot.handleUpdate(req.body);
}