import React from 'react';
import './App.css';

import { Layout, Button } from 'antd';
import 'antd/dist/reset.css';

const { Header, Footer, Sider, Content } = Layout;


//整体布局的CSS代码放在这里，其余的细节的样式放在 App.css 里面
const root_comp_style = {
    "headerStyle": {  color: '#ffffff',  height: '44px', lineHeight: '44px', display:'flex',  inlineHeight: "44px",backgroundColor: '#2d3538',paddingInline: 75    },

    // "layoutStyle": {border: "solid 1px #000", borderRadius: "10px", height: "100%"},
    //
    // "contentStyle": {textAlign: 'center', minHeight: 120, lineHeight: '120px', color: '#fff', backgroundColor: '#108ee9'},

}



function App() {
  return (
      <Layout className="layout">
          <Header style={root_comp_style.headerStyle}>
            <div style={{width: "100%"}}>
                <span className="system-title">XQC-System</span>
                <span className="paper-title">The tile of this paper</span>
            </div>

          </Header>
          <Content style={{padding: '0 75px', backgroundColor: '#ffffff', marginTop: '10px'}}>
              <div className="view">

              </div>
          </Content>
      </Layout>





  );
}

export default App;
