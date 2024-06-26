import { Commands } from '../schema/common';
import { TSendCommand } from '../schema/types';
import { SetActivity } from './setActivity';
export { Commands, SetActivity };
declare function commands(sendCommand: TSendCommand): {
    authenticate: (args: {
        access_token?: string | null | undefined;
    }) => Promise<{
        access_token: string;
        user: {
            username: string;
            discriminator: string;
            id: string;
            public_flags: number;
            avatar?: string | null | undefined;
            global_name?: string | null | undefined;
        };
        scopes: (-1 | "identify" | "email" | "connections" | "guilds" | "guilds.join" | "guilds.members.read" | "gdm.join" | "rpc" | "rpc.notifications.read" | "rpc.voice.read" | "rpc.voice.write" | "rpc.video.read" | "rpc.video.write" | "rpc.screenshare.read" | "rpc.screenshare.write" | "rpc.activities.write" | "bot" | "webhook.incoming" | "messages.read" | "applications.builds.upload" | "applications.builds.read" | "applications.commands" | "applications.commands.update" | "applications.commands.permissions.update" | "applications.store.update" | "applications.entitlements" | "activities.read" | "activities.write" | "relationships.read" | "voice" | "dm_channels.read" | "role_connections.write")[];
        expires: string;
        application: {
            id: string;
            description: string;
            name: string;
            icon?: string | null | undefined;
            rpc_origins?: string[] | undefined;
        };
    }>;
    authorize: (args: import("./authorize").AuthorizeInput) => Promise<{
        code: string;
    }>;
    captureLog: (args: import("./captureLog").CaptureLogInput) => Promise<{} | null>;
    encourageHardwareAcceleration: (args: void) => Promise<{
        enabled: boolean;
    }>;
    getChannel: (args: import("./getChannel").GetChannelInput) => Promise<{
        type: 0 | 10 | 1 | 4 | 3 | -1 | 2 | 5 | 6 | 11 | 12 | 13 | 14 | 15;
        id: string;
        voice_states: {
            user: {
                username: string;
                discriminator: string;
                id: string;
                bot: boolean;
                avatar_decoration_data: {
                    asset: string;
                    sku_id?: string | undefined;
                } | null;
                global_name?: string | null | undefined;
                avatar?: string | null | undefined;
                flags?: number | null | undefined;
                premium_type?: number | null | undefined;
            };
            nick: string;
            mute: boolean;
            voice_state: {
                deaf: boolean;
                mute: boolean;
                self_mute: boolean;
                self_deaf: boolean;
                suppress: boolean;
            };
            volume: number;
        }[];
        messages: {
            type: number;
            id: string;
            timestamp: string;
            channel_id: string;
            content: string;
            tts: boolean;
            mention_everyone: boolean;
            mentions: {
                username: string;
                discriminator: string;
                id: string;
                bot: boolean;
                avatar_decoration_data: {
                    asset: string;
                    sku_id?: string | undefined;
                } | null;
                global_name?: string | null | undefined;
                avatar?: string | null | undefined;
                flags?: number | null | undefined;
                premium_type?: number | null | undefined;
            }[];
            mention_roles: string[];
            mention_channels: {
                type: number;
                id: string;
                name: string;
                guild_id: string;
            }[];
            attachments: {
                id: string;
                url: string;
                size: number;
                filename: string;
                proxy_url: string;
                height?: number | null | undefined;
                width?: number | null | undefined;
            }[];
            embeds: {
                title?: string | null | undefined;
                type?: string | null | undefined;
                description?: string | null | undefined;
                url?: string | null | undefined;
                timestamp?: string | null | undefined;
                color?: number | null | undefined;
                footer?: {
                    text: string;
                    icon_url?: string | null | undefined;
                    proxy_icon_url?: string | null | undefined;
                } | null | undefined;
                image?: {
                    url?: string | null | undefined;
                    proxy_url?: string | null | undefined;
                    height?: number | null | undefined;
                    width?: number | null | undefined;
                } | null | undefined;
                thumbnail?: {
                    url?: string | null | undefined;
                    proxy_url?: string | null | undefined;
                    height?: number | null | undefined;
                    width?: number | null | undefined;
                } | null | undefined;
                video?: {
                    url?: string | null | undefined;
                    height?: number | null | undefined;
                    width?: number | null | undefined;
                } | null | undefined;
                provider?: {
                    name?: string | null | undefined;
                    url?: string | null | undefined;
                } | null | undefined;
                author?: {
                    name?: string | null | undefined;
                    url?: string | null | undefined;
                    icon_url?: string | null | undefined;
                    proxy_icon_url?: string | null | undefined;
                } | null | undefined;
                fields?: {
                    value: string;
                    name: string;
                    inline: boolean;
                }[] | null | undefined;
            }[];
            pinned: boolean;
            guild_id?: string | null | undefined;
            author?: {
                username: string;
                discriminator: string;
                id: string;
                bot: boolean;
                avatar_decoration_data: {
                    asset: string;
                    sku_id?: string | undefined;
                } | null;
                global_name?: string | null | undefined;
                avatar?: string | null | undefined;
                flags?: number | null | undefined;
                premium_type?: number | null | undefined;
            } | null | undefined;
            member?: {
                user: {
                    username: string;
                    discriminator: string;
                    id: string;
                    bot: boolean;
                    avatar_decoration_data: {
                        asset: string;
                        sku_id?: string | undefined;
                    } | null;
                    global_name?: string | null | undefined;
                    avatar?: string | null | undefined;
                    flags?: number | null | undefined;
                    premium_type?: number | null | undefined;
                };
                roles: string[];
                joined_at: string;
                deaf: boolean;
                mute: boolean;
                nick?: string | null | undefined;
            } | null | undefined;
            edited_timestamp?: string | null | undefined;
            reactions?: {
                emoji: {
                    id: string;
                    name?: string | null | undefined;
                    roles?: string[] | null | undefined;
                    user?: {
                        username: string;
                        discriminator: string;
                        id: string;
                        bot: boolean;
                        avatar_decoration_data: {
                            asset: string;
                            sku_id?: string | undefined;
                        } | null;
                        global_name?: string | null | undefined;
                        avatar?: string | null | undefined;
                        flags?: number | null | undefined;
                        premium_type?: number | null | undefined;
                    } | null | undefined;
                    require_colons?: boolean | null | undefined;
                    managed?: boolean | null | undefined;
                    animated?: boolean | null | undefined;
                    available?: boolean | null | undefined;
                };
                count: number;
                me: boolean;
            }[] | null | undefined;
            nonce?: string | number | null | undefined;
            webhook_id?: string | null | undefined;
            activity?: {
                type: number;
                party_id?: string | null | undefined;
            } | null | undefined;
            application?: {
                id: string;
                description: string;
                name: string;
                cover_image?: string | null | undefined;
                icon?: string | null | undefined;
            } | null | undefined;
            message_reference?: {
                message_id?: string | null | undefined;
                channel_id?: string | null | undefined;
                guild_id?: string | null | undefined;
            } | null | undefined;
            flags?: number | null | undefined;
            stickers?: unknown[] | null | undefined;
            referenced_message?: unknown;
        }[];
        guild_id?: string | null | undefined;
        name?: string | null | undefined;
        topic?: string | null | undefined;
        bitrate?: number | null | undefined;
        user_limit?: number | null | undefined;
        position?: number | null | undefined;
    }>;
    getChannelPermissions: (args: void) => Promise<{
        permissions: string | bigint;
    }>;
    getEntitlements: (args: void) => Promise<{
        entitlements: {
            type: 1 | 4 | 3 | -1 | 2 | 5 | 6 | 7;
            id: string;
            sku_id: string;
            application_id: string;
            user_id: string;
            gift_code_flags: number;
            gifter_user_id?: string | null | undefined;
            branches?: string[] | null | undefined;
            starts_at?: string | null | undefined;
            ends_at?: string | null | undefined;
            parent_id?: string | null | undefined;
            consumed?: boolean | null | undefined;
            deleted?: boolean | null | undefined;
            gift_code_batch_id?: string | null | undefined;
        }[];
    }>;
    getPlatformBehaviors: (args: void) => Promise<{
        iosKeyboardResizesView?: boolean | undefined;
    }>;
    getSkus: (args: void) => Promise<{
        skus: {
            type: 1 | 4 | 3 | -1 | 2 | 5;
            id: string;
            name: string;
            flags: number;
            application_id: string;
            price: {
                amount: number;
                currency: string;
            };
            release_date: string | null;
        }[];
    }>;
    openExternalLink: (args: import("./openExternalLink").OpenExternalLinkInput) => Promise<{} | null>;
    openInviteDialog: (args: void) => Promise<{} | null>;
    openShareMomentDialog: (args: {
        mediaUrl: string;
    }) => Promise<{} | null | undefined>;
    setActivity: (args: import("./setActivity").SetActivityInput) => Promise<{
        type: number;
        name: string;
        url?: string | null | undefined;
        created_at?: number | null | undefined;
        timestamps?: {
            start?: number | undefined;
            end?: number | undefined;
        } | null | undefined;
        application_id?: string | null | undefined;
        details?: string | null | undefined;
        state?: string | null | undefined;
        emoji?: {
            id: string;
            name?: string | null | undefined;
            roles?: string[] | null | undefined;
            user?: {
                username: string;
                discriminator: string;
                id: string;
                bot: boolean;
                avatar_decoration_data: {
                    asset: string;
                    sku_id?: string | undefined;
                } | null;
                global_name?: string | null | undefined;
                avatar?: string | null | undefined;
                flags?: number | null | undefined;
                premium_type?: number | null | undefined;
            } | null | undefined;
            require_colons?: boolean | null | undefined;
            managed?: boolean | null | undefined;
            animated?: boolean | null | undefined;
            available?: boolean | null | undefined;
        } | null | undefined;
        party?: {
            id?: string | null | undefined;
            size?: number[] | null | undefined;
        } | null | undefined;
        assets?: {
            large_image?: string | null | undefined;
            large_text?: string | null | undefined;
            small_image?: string | null | undefined;
            small_text?: string | null | undefined;
        } | null | undefined;
        secrets?: {
            join?: string | undefined;
            match?: string | undefined;
        } | null | undefined;
        instance?: boolean | null | undefined;
        flags?: number | null | undefined;
    }>;
    setConfig: (args: import("./setConfig").SetConfigInput) => Promise<{
        use_interactive_pip: boolean;
    }>;
    setOrientationLockState: (args: import("./setOrientationLockState").SetOrientationLockStateInput) => Promise<{} | null>;
    startPurchase: (args: import("./startPurchase").StartPurchaseInput) => Promise<{
        type: 1 | 4 | 3 | -1 | 2 | 5 | 6 | 7;
        id: string;
        sku_id: string;
        application_id: string;
        user_id: string;
        gift_code_flags: number;
        gifter_user_id?: string | null | undefined;
        branches?: string[] | null | undefined;
        starts_at?: string | null | undefined;
        ends_at?: string | null | undefined;
        parent_id?: string | null | undefined;
        consumed?: boolean | null | undefined;
        deleted?: boolean | null | undefined;
        gift_code_batch_id?: string | null | undefined;
    }[] | null>;
    userSettingsGetLocale: (args: void) => Promise<{
        locale: string;
    }>;
    initiateImageUpload: (args: void) => Promise<{
        image_url: string;
    }>;
    getInstanceConnectedParticipants: (args: void) => Promise<{
        participants: {
            username: string;
            discriminator: string;
            id: string;
            bot: boolean;
            flags: number;
            global_name?: string | null | undefined;
            avatar?: string | null | undefined;
            avatar_decoration_data?: {
                asset: string;
                skuId?: string | undefined;
            } | null | undefined;
            premium_type?: number | null | undefined;
            nickname?: string | undefined;
        }[];
    }>;
};
export default commands;
type Awaited<T> = T extends Promise<infer U> ? U : never;
export type CommandTypes = ReturnType<typeof commands>;
export type CommandResponseTypes = {
    [Name in keyof CommandTypes]: Awaited<ReturnType<CommandTypes[Name]>>;
};
export type CommandInputTypes = {
    [Name in keyof CommandTypes]: Parameters<CommandTypes[Name]>;
};
