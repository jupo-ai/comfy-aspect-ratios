import { app } from "../../../scripts/app.js";
import { $el } from "../../../scripts/ui.js";
import { mkName, loadCss, apiPost } from "../utils.js";

loadCss("extension/aspect-ratios.css");

const PACKAGE_NAME = "AspectRatios";
const CLASS_NAMES = [mkName(PACKAGE_NAME, "AspectRatios")];

// ==============================================
// Aspect Ratios
// ==============================================
const extension = {
    name: mkName(PACKAGE_NAME, "AspectRatios"), 

    beforeRegisterNodeDef: async function(nodeType, nodeData, app) {
        if (!CLASS_NAMES.includes(nodeType.comfyClass)) return;

        // --------------------------------------
        // onNodeCreated
        // --------------------------------------
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = async function() {
            const res = onNodeCreated?.apply(this, arguments);

            this._graspWidgets();
            this._createSwitchButton();
            this._createResultArea();
            this._bindCallback();
            await this._updateResult();
            return res;
        }
        


        // --------------------------------------
        // GraspWidgets
        //  : Python側で作成したウィジェットを取得
        // --------------------------------------
        nodeType.prototype._graspWidgets = function() {
            this.baseWidget = this.widgets.find(w => w.name === "base");
            this.fixedSideWidget = this.widgets.find(w => w.name === "fixed_side");
            this.stepWidget = this.widgets.find(w => w.name === "step");
            this.aspectWWidget = this.widgets.find(w => w.name === "aspect_w");
            this.aspectHWidget = this.widgets.find(w => w.name === "aspect_h");
            this.presetWidget = this.widgets.find(w => w.name === "preset");
        }

        // --------------------------------------
        // _createSwitchButton
        //  : 入れ替えボタン追加
        // --------------------------------------
        nodeType.prototype._createSwitchButton = function() {
            this.addWidget("button", "switch ⇅", null, () => {
                const temp = this.aspectWWidget.value;
                this.aspectWWidget.value = this.aspectHWidget.value;
                this.aspectHWidget.value = temp;
                this._updateResult();
            });
        }

        // --------------------------------------
        // _createResultArea
        //  : 計算結果表示エリアを作成
        // --------------------------------------
        nodeType.prototype._createResultArea = function() {
            const result = $el("div.jupo-aspect-ratios-result");
            const widthRow = $el("div.jupo-aspect-ratios-row");
            const heightRow = $el("div.jupo-aspect-ratios-row");

            const widthLabel = $el("span.jupo-aspect-ratios-label", {
                textContent: "width:"
            });
            const heightLabel = $el("span.jupo-aspect-ratios-label", {
                textContent: "height:"
            });
            this.resultWidthValue = $el("span.jupo-aspect-ratios-value");
            this.resultHeightValue = $el("span.jupo-aspect-ratios-value");

            widthRow.append(widthLabel, this.resultWidthValue);
            heightRow.append(heightLabel, this.resultHeightValue);
            result.append(widthRow, heightRow);

            const reusltWidget = this.addDOMWidget("result", "DOM", result);
            reusltWidget.computeSize = () => [, 82];
        }

        // --------------------------------------
        // _bindCallback
        //  : callbackを設定
        // --------------------------------------
        nodeType.prototype._bindCallback = function() {
            this.baseWidget.callback = () => this._updateResult();
            this.fixedSideWidget.callback = () => this._updateResult();
            this.stepWidget.callback = () => this._updateResult();
            this.aspectWWidget.callback = () => this._updateResult();
            this.aspectHWidget.callback = () => this._updateResult();
            this.presetWidget.callback = async (preset) => {
                const ratios = await apiPost(PACKAGE_NAME, "preset", { preset });
                const w = ratios.aspectW;
                const h = ratios.aspectH;
                if ((w !== null) && (h !== null)) {
                    this.aspectWWidget.value = w;
                    this.aspectHWidget.value = h;
                    await this._updateResult();
                }
            };
        }


        // --------------------------------------
        // UpdateResult
        //  : 計算結果表示メソッド
        // --------------------------------------
        nodeType.prototype._updateResult = async function() {
            const resolution = await apiPost(PACKAGE_NAME, "calc", {
                base: this.baseWidget.value, 
                fixedSide: this.fixedSideWidget.value, 
                step: this.stepWidget.value, 
                aspectW: this.aspectWWidget.value, 
                aspectH: this.aspectHWidget.value, 
            });

            const width = resolution.width;
            const height = resolution.height;

            this.resultWidthValue.textContent = width;
            this.resultHeightValue.textContent = height;

            this.setDirtyCanvas(true, false);
        };
    }, 


    loadedGraphNode: function(node) {
        if (!CLASS_NAMES.includes(node.comfyClass)) return;
        
        node._updateResult?.();
    }
};

app.registerExtension(extension);

