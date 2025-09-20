import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export enum MemberRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  GUEST = "GUEST",
}

export enum ChannelType {
  TEXT = "TEXT",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export class Profile {
  static collectionName = "profiles";

  public id: string = "";

  public userId!: string;

  public name!: string;

  public imageUrl!: string;

  public email!: string;

  public createdAt?: string;

  public updatedAt?: string;

  public servers?: Server[];

  public members?: Member[];

  public channels?: Channel[];
}

export class Server {
  static collectionName = "servers";

  public id: string = "";

  public name!: string;

  public imageUrl!: string;

  public inviteCode!: string;

  public profileId!: string;

  public createdAt?: string;

  public updatedAt?: string;

  public profile?: Profile;

  public members?: Member[];

  public channels?: Channel[];
}

export class Member {
  static collectionName = "members";

  public id: string = "";

  public role: MemberRole = MemberRole.GUEST;

  public profileId!: string;

  public serverId!: string;

  public createdAt?: string;

  public updatedAt?: string;

  public profile?: Profile;

  public server?: Server;

  public messages?: Message[];

  public directMessages?: DirectMessage[];

  public conversationsInitiated?: Conversation[];

  public conversationsReceived?: Conversation[];
}

export class Channel {
  static collectionName = "channels";

  public id: string = "";

  public name!: string;

  public type: ChannelType = ChannelType.TEXT;

  public profileId!: string;

  public serverId!: string;

  public createdAt?: string;

  public updatedAt?: string;

  public profile?: Profile;

  public server?: Server;

  public messages?: Message[];
}

export class Message {
  static collectionName = "messages";

  public id: string = "";

  public content!: string;

  public fileUrl?: string;

  public memberId!: string;

  public channelId!: string;

  public deleted: boolean = false;

  public createdAt?: string;

  public updatedAt?: string;

  public member?: Member;

  public channel?: Channel;
}

export class Conversation {
  static collectionName = "conversations";

  public id: string = "";

  public memberOneId!: string;

  public memberTwoId!: string;

  public directMessages?: DirectMessage[];

  public memberOne?: Member;

  public memberTwo?: Member;
}

export class DirectMessage {
  static collectionName = "directMessages";

  public id: string = "";

  public content!: string;

  public fileUrl?: string;

  public memberId!: string;

  public conversationId!: string;

  public deleted: boolean = false;

  public createdAt?: string;

  public updatedAt?: string;

  public member?: Member;

  public conversation?: Conversation;
}
