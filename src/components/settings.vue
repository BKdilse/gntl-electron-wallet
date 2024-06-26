<template>
<q-modal v-model="isVisible" maximized class="settings-modal">
    <q-modal-layout>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense @click="getPeers(false)" icon="reply" />
            <q-toolbar-title shrink>
                Settings
            </q-toolbar-title>

            <div class="row col justify-center q-pr-xl">
                <q-btn-toggle
                    v-model="page"
                    toggle-color="primary"
                    size="md"
                    :options="tabs"
                    @input="getPeers(true)"

                    />
            </div>

            <q-btn color="primary" @click="save" label="Save" />
        </q-toolbar>
        <div v-if="page=='general'">
            <div class="q-pa-lg">
                <SettingsGeneral ref="settingsGeneral"></SettingsGeneral>
            </div>
        </div>

        <div v-if="page=='preferences'">
            <div class="q-pa-md">

                <h6 class="q-mb-md" style="font-weight: 300">Preferences:</h6>
                <div>
                    <q-checkbox v-model="minimize_to_tray" label="Minimize to Tray" />
                </div>
                <div v-if="$q.platform.is.desktop && ($q.platform.is.win || $q.platform.is.mac)">
                    <q-checkbox v-model="autostart" label="Launch GNTL Portable Pool on Start-up" />
                </div>
                <div class="row items-end">
                    <div class="col-auto q-pb-sm">
                        <q-icon name="timer" size="24px" />
                        <span class="q-ml-sm">Inactivity Timeout</span>
                    </div>
                    <div class="col q-px-xl">
                        <div style="max-width:500px">
                            <q-slider
                                v-model="timeout"
                                label-always
                                fill-handle-always
                                :min="0" :max="65" :step="5"
                                :label-value="timeout_human"
                                />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <small>
                            Amount of time with no user input before logging out of open wallets
                        </small>
                    </div>
                </div>


                <h6 class="q-mb-md" style="font-weight: 300">Notifications:</h6>
                <div>
                    <q-checkbox v-model="notify_no_payment_id" label="Notify when making transaction without Payment ID" />
                </div>
                <div>
                    <q-checkbox v-model="notify_empty_password" label="Notify when creating or restoring a wallet with an insecure password" />
                </div>

            </div>
        </div>
        <div v-if="page=='exchange'">
                    <div class="q-pa-lg">
                        <SettingsExchange ref="settingsExchange"></SettingsExchange>
                    </div>
        </div>
        <div v-if="page=='peers'">
            <q-list :dark="theme=='dark'" no-border>
                <q-list-header>Peer list</q-list-header>

                <q-item link v-for="(entry, index) in daemon.connections" v-bind:key="entry.connection_id" @click.native="showPeerDetails(entry)">
                    <q-item-main>
                        <q-item-tile label>{{ entry.address }}</q-item-tile>
                        <q-item-tile sublabel>Height: {{ entry.height }}</q-item-tile>
                    </q-item-main>
                </q-item>

                <template v-if="daemon.bans.length">

                    <q-list-header>Banned peers (bans will cleared if wallet is restarted)</q-list-header>
                    <q-item v-for="(entry, index) in daemon.bans" v-bind:key="entry.host">
                        <q-item-main>
                            <q-item-tile label>{{ entry.host }}</q-item-tile>
                            <q-item-tile sublabel>Banned until {{ new Date(Date.now() + entry.seconds * 1000).toLocaleString() }}</q-item-tile>
                        </q-item-main>
                    </q-item>

                </template>

            </q-list>

        </div>

        <div v-if="page === 'language'">
        	            <language-select />
        </div>

    </q-modal-layout>

</q-modal>
</template>

<script>
import { Platform } from "quasar"
import { mapState } from "vuex"
import SettingsGeneral from "components/settings_general"
import LanguageSelect from "components/language_select"
import SettingsExchange from "components/settings_exchange"
export default {
    name: "SettingsModal",
    computed: {
        timeout_human() {
            if(this.timeout === 0) {
                return "1 minute"
            } else if(this.timeout === 65) {
                return "Never"
            } else {
                return this.timeout+" minutes"
            }
        },
        ...mapState({
            daemon: state => state.gateway.daemon,
            pending_config: state => state.gateway.app.pending_config,
            config: state => state.gateway.app.config,
            tabs: function(state) {
                let tabs = [
                    { label: this.$t("titles.settings.tabs.general"), value: 'general', icon: 'settings' },
                    { label: 'Preferences', value: 'preferences', icon: 'person'},
                    { label: this.$t("titles.settings.tabs.language"), value: 'language', icon: 'language' },
                    { label: this.$t("titles.settings.tabs.exchange"), value: 'exchange', icon: 'settings' },
                ]
                if(state.gateway.app.config.daemon.type != 'remote') {
                    tabs.push({label: 'Peers', value: 'peers', icon: 'cloud_queue'})
                }
                return tabs
            }
        })
    },
    data () {
        return {
            page: "general",
            theme: null,
            minimize_to_tray: null,
            autostart: null,
            notify_no_payment_id: null,
            notify_empty_password: null,
            timeout: 10,
            isVisible: false,
            enableGetPeers: false
        }
    },
    mounted: function () {
        this.theme = this.config.appearance.theme
        this.minimize_to_tray = this.config.preference.minimize_to_tray === null ? false : this.config.preference.minimize_to_tray
        this.autostart = this.config.preference.autostart == null ? false : this.config.preference.autostart
        this.notify_no_payment_id = this.config.preference.notify_no_payment_id
        this.notify_empty_password = this.config.preference.notify_empty_password
        this.timeout = Math.min(Math.floor(this.config.preference.timeout / (60*1000*5)) * 5, 65)
    },
    watch: {
        theme: function (theme, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                appearance: {
                    theme: this.theme
                }
            })
        },
        minimize_to_tray: function (minimize_to_tray, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    minimize_to_tray: this.minimize_to_tray
                }
            })
        },
        autostart: function (autostart, old) {
            if(old == null) return
            this.$gateway.setAutostartSettings(this.autostart)
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    autostart: this.autostart
                }
            })
        },
        notify_no_payment_id: function (notify_no_payment_id, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    notify_no_payment_id: this.notify_no_payment_id
                }
            })
        },
        notify_empty_password: function (notify_empty_password, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    notify_empty_password: this.notify_empty_password
                }
            })
        },
        timeout: function (timeout, old) {
            if(old == null) return
            if(timeout === 0) {
                timeout = 1
            } else if(timeout === 65) {
                timeout = 365*24*60 // never is actually one year
            }
            timeout *= 60*1000 // convert minutes to ms
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    timeout: timeout
                }
            })
        },
        isVisible: function () {
            if(this.isVisible == false) {
                this.$store.dispatch("gateway/resetPendingConfig")
            }
        }
    },
    methods: {
        getPeers(value){
            if (this.config.daemon.type && !this.config.daemon.type.includes("remote")) {
                if (this.page === "peers") {
                    if (value && !this.enableGetPeers ) {
                        this.enableGetPeers = value
                        this.$gateway.send("daemon", "get_peers", {enabled: true})
                    }
                } else {
                    this.enableGetPeers = false
                    this.$gateway.send("daemon", "get_peers", {enabled: false})
                }
            }
            if (!value) {
                this.enableGetPeers = value
                this.isVisible = value
            }
        },
        save() {
            this.$gateway.send("daemon", "get_peers", {enabled: false})
            this.$gateway.send("core", "save_config", this.pending_config);
            this.isVisible = false
        },
        showPeerDetails (entry) {
            this.$q.dialog({
                title: this.$t("dialog.banPeer.peerDetailsTitle"),
                message: JSON.stringify(entry, null, 2),
                ok: {
                    label: this.$t("dialog.banPeer.ok"),
                    color: "negative",
                },
                cancel: {
                    flat: true,
                    label: "Close",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(() => {

                this.$q.dialog({
                    title: this.$t("dialog.banPeer.title"),
                    message: this.$t("dialog.banPeer.message"),
                    prompt: {
                        model: "",
                        type: "number"
                    },
                    ok: {
                        label: this.$t("dialog.banPeer.ok"),
                        color: "negative"
                    },
                    cancel: {
                        flat: true,
                        label: this.$t("dialog.buttons.cancel"),
                        color: this.theme=="dark"?"white":"dark"
                    }
                }).then(seconds => {
                    this.$gateway.send("daemon", "ban_peer", {host: entry.host, seconds})
                }).catch(() => {

                })
            }).catch(() => {

            })
        }
    },
    components: {
     LanguageSelect,
     SettingsGeneral,
     SettingsExchange
    }
}
</script>

<style lang="scss">
</style>
