/**
 * 用户名正则表达式
 * 字母/数字/中文/下划线/斜杠
 * https://mothereff.in/regexpu#input=const+regex+=+/%5Cp%7BUnified_Ideograph%7D/u;&unicodePropertyEscape=1
 */
export const USERNAME_PATTERN = /^([a-z]|[A-Z]|[0-9]|_|-|[\u3400-\u4DBF\u4E00-\u9FFC\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29\u{20000}-\u{2A6DD}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{30000}-\u{3134A}])+$/u;

/** 用户名最小长度 */
export const USERNAME_MIN_LENGTH: number = 5;
/** 用户名最大长度 */
export const USERNAME_MAX_LENGTH: number = 15;

/** 用户昵称最小长度 */
export const NICKNAME_MIN_LENGTH: number = 1;
/** 用户昵称最大长度 */
export const NICKNAME_MAX_LENGTH: number = 15;

/** 用户密码最小长度 */
export const PASSWORD_MIN_LENGTH: number = 8;
/** 用户密码最大长度 */
export const PASSWORD_MAX_LENGTH: number = 50;

/** 个性签名最小长度 */
export const SIGNATURE_MIN_LENGTH: number = 1;
/** 个性签名最大长度 */
export const SIGNATURE_MAX_LENGTH: number = 100;

/** 文本消息最长长度 */
export const TEXT_MSG_MAX_LENGTH: number = 3000;

/** 会话列表分页行数 */
export const CHAT_LIST_ROWS: number = 15;