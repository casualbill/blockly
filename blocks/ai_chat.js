// AI Chat Block definition - JavaScript version

Blockly.Blocks['ai_chat'] = {
  init: function() {
    this.appendValueInput('PROMPT')
        .setCheck('String')
        .appendField('AI Chat');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['Llama 3', 'llama3'],
          ['Mistral 7B', 'mistral'],
          ['Qwen 2', 'qwen']
        ]), 'MODEL');
    this.appendDummyInput()
        .appendField('Temperature:')
        .appendField(new Blockly.FieldNumber(0.8, 0, 2, 0.1), 'TEMPERATURE');
    this.appendDummyInput()
        .appendField('TopP:')
        .appendField(new Blockly.FieldNumber(0.9, 0, 1, 0.1), 'TOPP');
    this.appendDummyInput()
        .appendField('Max Tokens:')
        .appendField(new Blockly.FieldNumber(512, 1, 2048), 'MAX_TOKENS');
    this.setOutput(true, 'String');
    this.setColour(230);
    this.setTooltip('AI Chat using WebLLM');
    this.setHelpUrl('');
  }
};

// Model Load Status Block
Blockly.Blocks['ai_model_loaded'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('AI Model Loaded');
    this.setOutput(true, 'Boolean');
    this.setColour(230);
    this.setTooltip('Check if AI model is loaded');
    this.setHelpUrl('');
  }
};

// Clear Chat History Block
Blockly.Blocks['ai_clear_history'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Clear AI Chat History');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(230);
    this.setTooltip('Clear AI chat history');
    this.setHelpUrl('');
  }
};

// AI Chat Generator
Blockly.JavaScript['ai_chat'] = function(block) {
  const model = block.getFieldValue('MODEL');
  const temperature = block.getFieldValue('TEMPERATURE');
  const topP = block.getFieldValue('TOPP');
  const maxTokens = block.getFieldValue('MAX_TOKENS');
  const prompt = Blockly.JavaScript.valueToCode(block, 'PROMPT', Blockly.JavaScript.ORDER_ATOMIC);

  return [
    `(async function() {
      const response = await window.aiChat(${prompt}, {
        model: '${model}',
        temperature: ${temperature},
        topP: ${topP},
        maxTokens: ${maxTokens}
      });
      return response;
    })()`,
    Blockly.JavaScript.ORDER_FUNCTION_CALL
  ];
};

Blockly.JavaScript['ai_model_loaded'] = function(block) {
  return ['window.aiModelLoaded()', Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript['ai_clear_history'] = function(block) {
  return 'window.aiClearHistory();\n';
};