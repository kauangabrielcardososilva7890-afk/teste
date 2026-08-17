module.exports = {
  content: ['./index.html', './*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      colors: {
        digiblue: {50:'#e8eaf8',100:'#c9ceef',500:'#0a1e8a',600:'#091a7a',700:'#08166b',800:'#07125c',900:'#060e4d'}
      }
    }
  }
};
