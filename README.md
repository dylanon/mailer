# Mailer

Email form serverless function built for [Zeit Now](https://github.com/zeit/now) and Dreamhost's email service.

## Setup

### Add secrets

The Dreamhost-hosted email address that messages will be sent from (your "mailer" address):
`npx now secrets add namespace-mail-user youraddresshere@email.com`

The password for that email address:
`npx now secrets add namespace-mail-pass yourpasswordhere`

The email address that messages will be sent to:
`npx now secrets add namespace-mail-send-to yourrecipienthere@email.com`

### Deploy to Now

`yarn deploy:prod`

## Usage

### POST /api/contact

```javascript
fetch('https://yourdomainhere.com/api/contact', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Just wanted to say hi!',
    senderEmail: 'sender@email.com',
    senderName: 'Some Sender',
    subject: 'Hello world'
  })
});
```
