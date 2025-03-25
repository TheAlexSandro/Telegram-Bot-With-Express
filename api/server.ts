import { Request, Response } from "express";
import helper from "../components/helper";
import axios from "axios";
import telegram from '../message';

interface WebhookRequest extends Request {
    query: {
        data: string;
    };
}

export const welcome = async (req: Request, res: Response): Promise<void> => {
    helper.response(res, 200, true, "Server active!");
};

export const webhook = async (req: WebhookRequest, res: Response): Promise<void> => {
    try {
        const { data } = req.query;
        if (!data) {
            helper.response(res, 400, false, "data parameter is required.", null, "PARAMETER_REQUIRED");
            return;
        }
        const datas = data.split(',');
        const token = datas[0]; const admin = datas[1];
        if (!admin.includes('[') && !admin.includes(']')) {
            helper.response(res, 400, false, "admin parameter are required to be an array. If there's 2 or more admin, separate it with , (comma)", null, "INVALID_PARAMETER_TYPE");
            return;
        }
        const admins = admin.replace(/\[/g, '').replace(/\]/g, '').split(',');

        axios.get(`https://api.telegram.org/bot${token}/getMe`).then(async function(result) {
            helper.response(res, 200, true, 'Oke!');
            return await telegram(token, req, result.data.result.id, admins);
        }).catch(function(err) {
            if (err?.response?.status === 401) {
                return helper.response(res, 400, false, "Unauthorized", null, "TOKEN_INVALID");
            }
            var text = err.response.statusText ? err.response.statusText : err;
            return helper.response(res, 400, false, text, "UNKNOWN_ERROR");
        });
    } catch (err: any) {
        helper.response(res, 400, false, err, null, "UNKNOWN_ERROR");
    }
};
