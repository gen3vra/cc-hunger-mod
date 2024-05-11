var origItemUseFunc = null;
var hunger = 100;
var tickHurt = 0;
var lowHungerState = false;
var starvingState = false;
var lastNotifiedHunger = -1;
var pre = "cchunger.vars.";
ig.ENTITY.Player.inject({
    update(...args) {
        if (ig.game.playerEntity.itemConsumer.hungerAdded == null) {
            try {
                setup();
            } catch (e) {
                console.log(e);
            }
        }

        if (!sc.model.isCutscene())
            hunger -= ig.system.tick / 11;

        if (hunger >= 20) {
            lowHungerState = false;
            starvingState = false;
            sc.HP_LOW_WARNING = 0.33;
        } else if (hunger < 10) {
            if (!starvingState) {
                new cc.ig.events.SHOW_AR_MSG(
                    {
                        entity: {
                            player: true
                        },
                        text: {
                            en_US: 'STARVING',
                        },
                        time: 7,
                        mode: 'LINE_EMPTY',
                        color: 'RED',
                        actionDetached: true,
                        hideOutsideOfScreen: false,
                    }).start(ig.game.playerEntity);
                starvingState = true;
                sc.HP_LOW_WARNING = 1;
            }
            if (sc.model.player.params.currentHp > 200)
                ig.game.playerEntity.instantDamage(5);
            else
                ig.game.playerEntity.instantDamage(ig.system.tick / 3);

            if (hunger < 0)
                hunger = 0;
        } else if (hunger < 20) {
            if (!lowHungerState) {
                new cc.ig.events.SHOW_SIDE_MSG(
                    {
                        message: {
                            en_US: "..."
                        },
                        type: "SHOW_SIDE_MSG",
                        person: {
                            person: "main.lea",
                            expression: "EXHAUSTED"
                        }
                    }).start(ig.game.playerEntity);
                new cc.ig.events.SHOW_AR_MSG(
                    {
                        entity: {
                            player: true
                        },
                        text: {
                            en_US: 'HUNGRY',
                        },
                        time: 5,
                        mode: 'NO_LINE',
                        color: 'RED',
                        actionDetached: true,
                        hideOutsideOfScreen: false,
                    }).start(ig.game.playerEntity);
                lowHungerState = true;
            }
        }

        notifyHunger();

        return this.parent(...args);
    },
});
function notifyHunger() {
    if (hunger - lastNotifiedHunger > 20 || lastNotifiedHunger - hunger > 20) {
        if (hunger > 10) {
            new cc.ig.events.SHOW_AR_MSG(
                {
                    entity: {
                        player: true
                    },
                    text: {
                        en_US: 'HUNGER: ' + ((hunger < 100) ? Math.floor(hunger) + '%' : "100% (OVERFED)"),
                    },
                    time: 5,
                    mode: "NO_LINE",
                    color: "GREEN",
                    actionDetached: true,
                    hideOutsideOfScreen: false,
                }).start(ig.game.playerEntity);
        }
        lastNotifiedHunger = hunger;
        ig.vars.set(pre + "lastNotifiedHunger", lastNotifiedHunger);
        ig.vars.set(pre + "hunger", hunger);
    }
}
function setup() {
    hunger = ig.vars.get(pre + "hunger") || 100;
    lastNotifiedHunger = ig.vars.get(pre + "lastNotifiedHunger") || -1;
    origItemUseFunc = ig.game.playerEntity.itemConsumer.runItemUseAction;
    ig.game.playerEntity.itemConsumer.runItemUseAction = function () {
        let args = [...arguments];
        lastNotifiedHunger = -1;
        let hungerRestore = 50;
        try {
            hungerRestore = sc.inventory.getItem(args[2]).cost / 3;
        } catch (e) {
            console.log(e);
        }

        hunger += hungerRestore;
        if (hunger > 150)
            hunger = 150;
        origItemUseFunc.bind(this)(...arguments);
    }

    ig.game.playerEntity.itemConsumer.hungerAdded = true;
}