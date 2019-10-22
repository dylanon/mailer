import { NowRequest, NowResponse } from '@now/node'
import nodemailer from 'nodemailer'
import EnvVariable from '../types/EnvVariable'
import BodyProperty from '../types/BodyProperty'

export default (request: NowRequest, response: NowResponse) => {
  const badRequestError = (reason: string): void => {
    response.status(400).send(reason)
    return
  }

  if (request.method !== 'POST') {
    return badRequestError(`Invalid HTTP method.`)
  }

  const retrieveEnvVariable = (variableName: EnvVariable) => {
    return process.env[variableName]
  }

  const mailUser = retrieveEnvVariable(EnvVariable.MAIL_USER)
  const mailPass = retrieveEnvVariable(EnvVariable.MAIL_PASS)
  const mailTo = retrieveEnvVariable(EnvVariable.MAIL_SEND_TO)

  const { body } = request

  if (!body) {
    return badRequestError(`Missing request body.`)
  }

  const requiredBodyPropertyNames = [
    BodyProperty.MESSAGE,
    BodyProperty.SENDER_EMAIL,
    BodyProperty.SENDER_NAME,
    BodyProperty.SUBJECT,
  ]

  const bodyPropertyNames = Object.keys(body)
  const missingProperties = requiredBodyPropertyNames
    .map(name => {
      if (!bodyPropertyNames.includes(name)) {
        return name
      }
    })
    .filter(name => name)

  if (missingProperties.length) {
    return badRequestError(
      `Missing propert${
        missingProperties.length > 1 ? 'ies' : 'y'
      }: ${missingProperties.join(', ')}.`
    )
  }

  const {
    senderName,
    subject,
    message: text,
    senderEmail,
    ...otherBodyProperties
  } = body
  const hasDisplayName = !!senderName.trim()
  const displaySubject = `Received email: ${subject}`
  const otherBodyPropertyEntries = Object.entries(otherBodyProperties)

  const transporter = nodemailer.createTransport({
    host: 'smtp.dreamhost.com',
    port: 465,
    secure: true,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  transporter.verify(error => {
    if (error) {
      response.status(500).send(`Invalid transporter config.`)
    }
  })
  const message = {
    from: `Mailer <${mailUser}>`,
    to: mailTo,
    subject: displaySubject,
    text: `
You received an email from ${
      hasDisplayName ? `${senderName} (${senderEmail})` : senderEmail
    }.

Here's the message:


${text}


${
  otherBodyPropertyEntries.length
    ? `
---------------------------------------------------
Here's the additional information collected by your email form:

${otherBodyPropertyEntries
  .map(([name, value]) => {
    return `${name}: ${value}`
  })
  .join('\n')}
`
    : `---------------------------------------------------`
}
You can reply to ${
      hasDisplayName ? senderName : 'them'
    } by replying to this e-mail.

Love,
Your Friendly Neighbourhood Mailer 🤖
    `,
    sender: `Mailer`,
    replyTo: senderEmail,
  }
  transporter.sendMail(message, (error, ...args) => {
    if (error) {
      console.log(error)
      response.status(500).send(`Message failed to send`)
    } else {
      response.status(200).send(`Sent!`)
    }
  })
}
