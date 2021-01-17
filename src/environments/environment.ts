// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  captchaUrl: '/onchat/index/captcha',

  userUrl: '/onchat/user/',
  chatroomUrl: '/onchat/chatroom/',
  friendUrl: '/onchat/friend/',
  chatUrl: '/onchat/chat/',

  socketUrl: '',
  socketPath: '/ws/socket.io',
};
