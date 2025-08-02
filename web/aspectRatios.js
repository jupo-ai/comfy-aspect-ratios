import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";
import { $el } from "../../scripts/ui.js";
import { _name, _endpoint, loadCSS } from "./utils.js";

loadCSS("css/aspectRatios.css");

const extension = {
    name: _name("AspectRatios"), 

    beforeRegisterNodeDef: function(nodeType, nodeData, app) {
        if (nodeType.comfyClass === _name("AspectRatios")) {

            const __onAdded = nodeType.prototype.onAdded;
            nodeType.prototype.onAdded = async function() {
                const r = __onAdded?.apply(this, arguments);
                
                // python側で設定した各種ウィジェット
                this.base = this.widgets[0];
                this.fixedSide = this.widgets[1];
                this.step = this.widgets[2];
                this.aspectW = this.widgets[3];
                this.aspectH = this.widgets[4];
                this.preset = this.widgets[5];

                // アスペクト比入れ替えボタンを追加
                // callbackは後程設定
                this.switchButton = this.addWidget("button", "switch ⇅", null, null)

                // 計算結果表示スペースのDOMを作成
                const result = $el("div.jupo-aspect-ratios-result");
                const widthRow = $el("div.jupo-aspect-ratios-row");
                const heightRow = $el("div.jupo-aspect-ratios-row");

                // ラベルと値を別々の要素に
                const widthLabel = $el("span.jupo-aspect-ratios-label", { textContent: "width:"});
                const heightLabel = $el("span.jupo-aspect-ratios-label", { textContent: "height:"});
                this.resultWidthValue = $el("span.jupo-aspect-ratios-value");
                this.resultHeightValue = $el("span.jupo-aspect-ratios-value");

                // 行に追加
                widthRow.appendChild(widthLabel);
                widthRow.appendChild(this.resultWidthValue);
                heightRow.appendChild(heightLabel);
                heightRow.appendChild(this.resultHeightValue)
                
                // 作成したDOMを追加
                result.appendChild(widthRow);
                result.appendChild(heightRow);
                const resultWidget = this.addDOMWidget("result", "DOM", result);
                resultWidget.computeSize = () => [, 82];

                // 各callback設定
                this.base.callback = () => this.updateResult();
                this.fixedSide.callback = () => this.updateResult();
                this.step.callback = () => this.updateResult();
                this.aspectW.callback = () => this.updateResult();
                this.aspectH.callback = () => this.updateResult();
                this.switchButton.callback = () => {
                    const temp = this.aspectW.value;
                    this.aspectW.value = this.aspectH.value;
                    this.aspectH.value = temp;
                    this.updateResult();
                };
                this.preset.callback = async (preset) => {
                    const res = await api.fetchApi(_endpoint("aspect_ratios/preset"), {
                        method: "POST", 
                        body: JSON.stringify({preset: preset})
                    });
                    const ratios = await res.json();

                    const w = ratios.aspectW;
                    const h = ratios.aspectH;
                    if ((w !== null) && (h !== null)) {
                        this.aspectW.value = w;
                        this.aspectH.value = h;
                        this.updateResult();
                    }
                };

                this.updateResult();
                return r;
            };

            // 計算結果表示メソッド
            nodeType.prototype.updateResult = async function() {
                const res = await api.fetchApi(_endpoint("aspect_ratios/calc"), {
                    method: "POST", 
                    body: JSON.stringify({
                        base: this.base.value, 
                        fixedSide: this.fixedSide.value, 
                        step: this.step.value, 
                        aspectW: this.aspectW.value, 
                        aspectH: this.aspectH.value
                    })
                });
                const resolution = await res.json();
                const width = resolution.width;
                const height = resolution.height;
                
                this.resultWidthValue.textContent = width;
                this.resultHeightValue.textContent = height;

                this.setDirtyCanvas(true, false);
            };
        }
    }, 

    loadedGraphNode: function(node) {
        if (node.comfyClass === _name("AspectRatios")) {
            node.updateResult();
        }
    }, 
};


app.registerExtension(extension);
