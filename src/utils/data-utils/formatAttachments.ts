import { IAttachment, ICommentAttachment } from "../common";

/** 
 * @description formats post attachments
 * @param {IAttachment[]} attachments
 * @returns formatted attachments {secure_url, type}
**/
export const formatPostAttachments = (attachments: IAttachment[]) => {
    return attachments
        .filter((attachment) => attachment?.secure_url)
        .map((attachment) => ({
            secure_url: attachment.secure_url,
            type: attachment.type,
        }));
};
// =============================================================================

/** 
 * @description formats comment attachments
 * @param {ICommentAttachment} attachment
 * @returns formatted attachments {secure_url}
**/
export const formatCommentAttachment = (attachment: ICommentAttachment | null ) => {
    return {
        secure_url: attachment && attachment.secure_url,
    };
};
