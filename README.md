# RusKDiscordBot
「らすくもん」という名前のDiscord Botです。友人とのサーバーでのコミュニケーションを補助するために機能を盛り込みました。  
以下の機能を揃えています。

## モザイク機能
会話中にいきなりnsfwな画像が貼られた際に、「🇭」のリアクションが一定数を超えると、自動で画像にモザイク処理を施して、元の画像を別のスレッドに投稿したのち、元の投稿を削除します。
- `/changethreshold threshold:<数>`で、必要なリアクションの個数を変更します。
- `/changemosaiccount mosaiccount:<数>`で、モザイクの度合いを変更します。

これらのコマンドは管理者権限を持っているユーザのみが使用できます。

## Starboard機能
メッセージについている💥のリアクションが一定数を超えると、Starboard用のスレッドにメッセージを転送します。
Starboard botとほぼ同等の機能を備えております。
- `/changestarboardthreshold threshold:<数>`で、必要なリアクションの個数を変更します。

これらのコマンドは管理者権限を持っているユーザのみが使用できます。

## 画像がnsfwかどうかを判定する。
`/checknsfw image:<画像>`で、送信した画像がnsfwかどうかを評価します。評価にはnsfwjsを使用しております。

## 画像を説明させる
`/describeimage image:<画像>`で、送信した画像をGeminiに解説させます。

# Usage

npmのlistです。これを参考にパッケージをインストールしてください
```
RuskDiscordBot@
├── @discordjs/voice@0.18.0
├── @google/genai@1.3.0
├── @tensorflow/tfjs-node@4.22.0
├── axios@1.9.0
├── canvas@3.1.0
├── discord.js@14.19.3
├── ffmpeg-static@5.2.0
├── ffmpeg@0.0.4
├── jpeg-js@0.4.4
├── nsfwjs@4.2.1
├── sharp@0.34.2
└── tweetnacl@1.0.3
```

config.jsonの各文字列に、対応する値を各自で入力してください。
- token: Discord Botのトークン
- clientId: BotのユーザID
- guildId: BotのいるサーバーID
- forwardThreadId: モザイク処理の際に元投稿を転送するスレッドID
- geminiApiKey: Gemini APIのキー
- starboardChannelId: starboard機能において、投稿を転送するスレッドID
- LogThreadId: Botのログ出力用のスレッドID
```
{
    "token": "",
    "clientId": "",
    "guildId": "",
    "forwardThreadId": "",
    "geminiApiKey": "",
    "starboardChannelId": "",
    "logThreadId": ""
}

Botの初回実行時には、スラッシュコマンドを読み込む必要がありますので、下記を実行してください。
```
node ./commandReg.js
```

```
下記を実行してください。botが立ち上がります。
```
node ./index.js
```

