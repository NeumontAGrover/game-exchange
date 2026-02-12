// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "game-exchange",
  brokers: ["game-exchange-kafka:9092"],
});
const producer = kafka.producer();

export namespace KafkaService {
  export async function sendUpdatedPasswordEvent(email: string) {
    await producer.connect();
    await producer.send({
      topic: "user-updated-password",
      messages: [{ value: email }],
    });
    await producer.disconnect();
  }

  export async function sendOfferCreatedEvent(
    offerorEmail: string,
    offereeEmail: string,
  ) {
    await producer.connect();
    await producer.send({
      topic: "offer-created",
      messages: [{ value: offerorEmail }, { value: offereeEmail }],
    });
    await producer.disconnect();
  }

  export async function sendOfferAcceptedEvent(
    offerorEmail: string,
    offereeEmail: string,
  ) {
    await producer.connect();
    await producer.send({
      topic: "offer-accepted",
      messages: [{ value: offerorEmail }, { value: offereeEmail }],
    });
    await producer.disconnect();
  }

  export async function sendOfferRejectedEvent(
    offerorEmail: string,
    offereeEmail: string,
  ) {
    await producer.connect();
    await producer.send({
      topic: "offer-rejected",
      messages: [{ value: offerorEmail }, { value: offereeEmail }],
    });
    await producer.disconnect();
  }
}
