<template>
<div>

    <template v-if="tx_list_paged.length === 0">
        <p class="q-pa-md q-mb-none">{{ $t("strings.noTransactionsFound") }}</p>
    </template>

    <template v-else>
        <q-infinite-scroll :handler="loadMore" ref="scroller">
            <q-list link no-border :dark="theme=='dark'" class="tx-list">
                <q-item v-for="(tx, index) in tx_list_paged" :key="tx.txid"
                        @click.native="details(tx)" :class="'tx-'+tx.type">
                    <q-item-side>
                        <TxTypeIcon :type="tx.type" />
                    </q-item-side>
                    <q-item-main>
                        <q-item-tile class="monospace ellipsis" label>{{ tx.txid }}</q-item-tile>
                        <q-item-tile sublabel>{{ formatHeight(tx) }}</q-item-tile>

                    </q-item-main>
                    <q-item-side>
                        <q-item-tile label>
                            <FormatGntl :amount="tx.amount" raw-value />
                        </q-item-tile>
                        <q-item-tile sublabel>
                            <timeago :datetime="tx.timestamp*1000" :auto-update="60">
                            </timeago>
                        </q-item-tile>
                    </q-item-side>

                    <q-context-menu>
                        <q-list link separator style="min-width: 150px; max-height: 300px;">
                            <q-item v-close-overlay
                                    @click.native="details(tx)">
                                <q-item-main label="Show details" />
                            </q-item>

                            <q-item v-close-overlay
                                    @click.native="copyTxid(tx.txid, $event)">
                                <q-item-main label="Copy transaction id" />
                            </q-item>

                            <q-item v-close-overlay
                                    @click.native="openExplorer(tx.txid)">
                                <q-item-main label="View on explorer" />
                            </q-item>
                        </q-list>
                    </q-context-menu>

                </q-item>
                <q-spinner-dots slot="message" :size="40"></q-spinner-dots>
            </q-list>
        </q-infinite-scroll>
    </template>

    <TxDetails ref="txDetails" />

</div>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
import { QSpinnerDots } from "quasar"
import Identicon from "components/identicon"
import TxTypeIcon from "components/tx_type_icon"
import TxDetails from "components/tx_details"
import FormatGntl from "components/format_gntl"
export default {
    name: "TxList",
    props: {
        limit: {
            type: Number,
            required: false,
            default: -1
        },
        type: {
            type: String,
            required: false,
            default: "all"
        },
        txid: {
            type: String,
            required: false,
            default: ""
        },
        toOutgoingAddress: {
            type: String,
            required: false,
            default: ""
        },
        toIncomingAddressIndex: {
            type: Number,
            required: false,
            default: -1
        },
    },
    data () {
        return {
            page: 0,
            tx_list_filtered: [],
            tx_list_paged: []
        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        current_height: state => state.gateway.daemon.info.height,
        wallet_height: state => state.gateway.wallet.info.height,
        tx_list: state => state.gateway.wallet.transactions.tx_list
    }),
    created () {
        this.filterTxList()
        this.pageTxList()
    },
    watch: {
        wallet_height: {
            handler(val, old){
                if(val == old) return
                this.filterTxList()
                this.pageTxList()
            }
        },
        tx_list: {
            handler(val, old){
                if(val.length == old.length) return
                this.filterTxList()
                this.pageTxList()
            }
        },
        type: {
            handler(val, old){
                if(val == old) return
                if(this.$refs.scroller) {
                    this.$refs.scroller.stop()
                    this.page = 0
                    this.$refs.scroller.reset()
                    this.$refs.scroller.resume()
                }
                this.filterTxList()
                this.pageTxList()
            }
        },
        txid: {
            handler(val, old){
                if(val == old) return
                if(this.$refs.scroller) {
                    this.$refs.scroller.stop()
                    this.page = 0
                    this.$refs.scroller.reset()
                    this.$refs.scroller.resume()
                }
                this.filterTxList()
                this.pageTxList()
            }
        },
    },
    methods: {
        filterTxList () {
            this.tx_list_filtered = this.tx_list.filter((tx) => {
                let valid = true
                if(this.type !== "all" && this.type !== tx.type) {
                    valid = false
                    return valid
                }

                if(this.txid !== "") {
                    valid = tx.txid.toLowerCase().indexOf(this.txid.toLowerCase()) !== -1
                    return valid
                }

                if(this.toOutgoingAddress !== "") {
                    if(tx.hasOwnProperty("destinations")) {
                        valid = tx.destinations.filter((destination) => { return destination.address === this.toOutgoingAddress }).length;
                    } else {
                        valid = false
                    }
                    return valid
                }

                if(this.toIncomingAddressIndex !== -1) {
                    valid = tx.hasOwnProperty("subaddr_index") && tx.subaddr_index.minor == this.toIncomingAddressIndex
                    return valid
                }

                return valid
            })
        },
        pageTxList () {
            this.tx_list_paged = this.tx_list_filtered.slice(0, this.limit !== -1 ? this.limit : this.page * 24 + 24)
        },
        loadMore: function(index, done) {
            this.page = index
            if(this.limit !== -1 || this.tx_list_filtered.length < this.page * 24 + 24) {
                this.$refs.scroller.stop()
            }
            this.pageTxList()
            this.$nextTick(() => {
                done()
            })
        },
        details (tx) {
            this.$refs.txDetails.tx = tx;
            this.$refs.txDetails.txNotes = tx.note;
            this.$refs.txDetails.isVisible = true;
        },
        formatHeight(tx) {
            let height = tx.height;
            let confirms = Math.max(0, this.wallet_height - height);
            if(height == 0)
                return "Pending"
            if(confirms < Math.max(10, tx.unlock_time - height))
                return `Height: ${height} (${confirms} confirm${confirms==1?'':'s'})`
            else
                return `Height: ${height} (confirmed)`
        },
        copyTxid (txid, event) {
            event.stopPropagation()
            for(let i = 0; i < event.path.length; i++) {
                if(event.path[i].tagName == "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }
            clipboard.writeText(txid)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Txid copied to clipboard"
            })
        },
        openExplorer (txid) {
            this.$gateway.send("core", "open_explorer", {type: "tx", id: txid})
        }
    },
    components: {
        QSpinnerDots,
        Identicon,
        TxTypeIcon,
        TxDetails,
        FormatGntl
    }
}
</script>

<style lang="scss">
</style>
