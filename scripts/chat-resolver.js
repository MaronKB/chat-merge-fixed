import { CHTMRGSettings, CHTMRG_OPTIONS } from "./settings.js";

export class ChatResolver {
    
    static resolvePreCreateMessage(doc, ChatMessageData) {
        
        ChatMessageData.content = ChatMessageData.content.replace(/\*\*(.*)\*\*/g,"<b>$1</b>");
        ChatMessageData.content = ChatMessageData.content.replace(/\*(.*)\*/g,"<i>$1</i>");
        ChatMessageData.content = ChatMessageData.content.replace(/( )(?![^<]*>|[^<>]*<)/g,"&nbsp;");
        
        if(!CHTMRGSettings.getSetting(CHTMRG_OPTIONS.ENABLE_MERGE)) return;
        
        if(game.chtmrg_flag) return;
        
        if (!game.messages.has(game.chtmrg_lastmessage.id)) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        if (ChatMessageData.speaker === undefined) {
            if(game.users.get(ChatMessageData.user).name !== game.chtmrg_lastmessage.alias) {
                game.chtmrg_flag = true;
                game.chtmrg_lastmessage = {};
                return;
            }
        }
        else {
            if(ChatMessageData.speaker.alias !== game.chtmrg_lastmessage.alias) {
                game.chtmrg_flag = true;
                game.chtmrg_lastmessage = {};
                return;
            }
        }

	    if (ChatMessageData.type === 0) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }

        if (ChatMessageData.type !== game.chtmrg_lastmessage.data.type) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }

        if(ChatMessageData.whisper != undefined) {
            if(!ChatMessageData.whisper.equals(game.chtmrg_lastmessage.data.whisper) || ChatMessageData.user != game.chtmrg_lastmessage.data.user) {
                game.chtmrg_flag = true;
                game.chtmrg_lastmessage = {};
                return;
            }
        }
        else if (![].equals(game.chtmrg_lastmessage.data.whisper)) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        if(ChatMessageData.roll != undefined) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        if(game.chtmrg_lastmessage.isRoll) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        if((Date.now() - game.chtmrg_lastmessage.data.timestamp) / 1000 > CHTMRGSettings.getSetting(CHTMRG_OPTIONS.MERGE_TIME)) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        let merge_linse = CHTMRGSettings.getSetting(CHTMRG_OPTIONS.MERGE_LINE);
        
        if(merge_linse > 1 && merge_linse - 2 < (game.chtmrg_lastmessage.data.content.match(/<br>/g) || []).length) {
            game.chtmrg_flag = true;
            game.chtmrg_lastmessage = {};
            return;
        }
        
        if(ChatMessageData.flags === undefined || ChatMessageData.flags === null) {
           ChatMessageData.flags = {"CHTMRG_APPEND" : true, "CHTMRG_ORIGINAL" : ChatMessageData.content};
        }
       else {
           ChatMessageData.flags = Object.assign(ChatMessageData.flags, {"CHTMRG_APPEND" : true, "CHTMRG_ORIGINAL" : ChatMessageData.content});
       }
        ChatMessageData.content = game.chtmrg_lastmessage.data.content + "<br>" + ChatMessageData.content;
        doc.data.update({
            flags: ChatMessageData.flags,
            content: ChatMessageData.content
        });
        
        game.chtmrg_lastmessage.delete();
        
        return;
    }
    
    static onRenderChatMessage(chatMessage, html, ChatMessageData) {
        
        if(CHTMRGSettings.getSetting(CHTMRG_OPTIONS.DUP_CLEAN)) {
           var msg1 = Array.from(game.messages)[game.messages.size-1];
           var msg2 = Array.from(game.messages)[game.messages.size-2];
           if(msg1 != undefined && msg2 != undefined) {
               if(msg1.data.user == msg2.data.user) {
                   if(Math.abs(msg1.data.timestamp - msg2.data.timestamp) < 30) {
                        msg2.delete();
                   }
               }
           }
        }
           
        if(!CHTMRGSettings.getSetting(CHTMRG_OPTIONS.ENABLE_MERGE)) return;
        
        let message = ChatMessageData.message;
           
        if(game.chtmrg_flag) {
            game.chtmrg_lastmessage = chatMessage;
            game.chtmrg_flag = false;
            return;
        }
        
        game.chtmrg_lastmessage = chatMessage;

        return;
	}
           
   static onChatBubble(token, html, message, {emote=false}={}) {
       if(!CHTMRGSettings.getSetting(CHTMRG_OPTIONS.SINGLE_BUBBLE)) return true;
           
       if(game.chtmrg_lastmessage.data.flags["CHTMRG_APPEND"] === true) {
            if((message.match(/<br>/g) || []).length > 0) {
                var temp = game.chtmrg_lastmessage.data.content;
                game.chtmrg_lastmessage.data.content = game.chtmrg_lastmessage.data.flags["CHTMRG_ORIGINAL"];
                game.messages.sayBubble(game.chtmrg_lastmessage);
                game.chtmrg_lastmessage.data.content = temp;
                return false;
            }
       }
       return true;
   }

}
