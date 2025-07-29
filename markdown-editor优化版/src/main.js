import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css'  // 确保导入样式
import App from './App.vue'

Vue.use(iView)

new Vue({
  render: h => h(App),
}).$mount('#app')
