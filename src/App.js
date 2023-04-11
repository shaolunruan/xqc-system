import React, {useState} from 'react';
import * as d3 from 'd3'
import './App.css';

import {Layout, Row, Col, Form, Radio, ConfigProvider, Select, Space, Slider, InputNumber, Button} from 'antd';
const { Option } = Select;
const { Header, Footer, Sider, Content } = Layout;
import 'antd/dist/reset.css';
import {SisternodeOutlined} from '@ant-design/icons';




import View from "./Components/View";
import OriginCircuit from "./Components/OriginCircuit";
import Dandelion from "./Components/Dandelion";
import Legend from "./Components/Legend";




const HEADER_HEIGHT = 40, WHOLE_MARGIN_LR = 100


//整体布局的CSS代码放在这里，其余的细节的样式放在 App.css 里面
const root_comp_style = {
    "headerStyle": {
        width: '100%',
        color: '#ffffff',
        height: `${HEADER_HEIGHT}px`,
        lineHeight: `${HEADER_HEIGHT-10}px`,
        backgroundColor: '#333b3e',
        paddingTop: '8px',
        paddingBottom: '10px',
        marginBottom: '20px',
        // paddingInline: WHOLE_MARGIN_LR
    },


    "contentStyle": {
        height: "100%",
        border: "solid 1px #515962",
        borderRadius: "12px",
        padding: "8px"
    }
}



function App() {


    // 控制 选择的算法
    // const [param_algo, setAlgo] = useState('qiskit_grover_2q')
    const [param_algo, setAlgo] = useState('grover_n2_QASMBench')
    const [statevector, setStatevector] = useState([])
    const [theta, setTheta] = useState(1)
    const [point_radius, setPoint_radius] = useState(8)





    function handleValueChange(event){

        // setAlgo(event.target.value)
        setAlgo(event)

    }


    function change_statevector(item1, item2) {
        setStatevector([item1, item2])
    }


    function change_theta(value){
        setTheta(value)
    }

    function change_pointRadius(value){
        setPoint_radius(value)
    }

    function selection_clear(){
        d3.select('.selection').style('opacity', 0)
    }







    return (

        <ConfigProvider theme={{ hashed: false }}>


            <Layout style={{ height: "100%"}}>
                <Content style={root_comp_style.contentStyle}>
                    <Header style={root_comp_style.headerStyle}>
                        <div style={{width: "100%"}}>
                            <SisternodeOutlined  style={{fontSize: '1.3em'}}/>
                            <span className="system-title">QuantumEyes</span>
                            <span className="paper-title">QuantumEyes: Towards Better Interpretability of Quantum Circuits</span>
                        </div>

                    </Header>

                    {/* control panel*/}
                    <Row  justify="center">
                        <Col style={{width: '98%'}}>
                            <div className={'component control_panel'}>

                                <Form size={'small'} layout={'inline'}>

                                    {/*<Form.Item style={{paddingLeft: '30px', marginRight: '30px'}}>*/}
                                    {/*    <i className="fas fa-pen view_title_icon" style={{fontSize: '1.5em'}}/>*/}
                                    {/*    <span className={'view_title_text'} style={{fontSize: '1.8em'}}> Control panel </span>*/}
                                    {/*</Form.Item>*/}


                                    <Space size={100}>


                                        <Form.Item label="Algo select"
                                                   style={{ width: 180 }}
                                                   >
                                            <Select placeholder="Please select an algorithm"
                                                    defaultValue={param_algo}
                                                    onChange={handleValueChange}
                                                    style={{ width: 100 }}
                                            >
                                                <Option value="grover_n2_QASMBench">Grover-n2 QASMBench</Option>
                                                <Option value="qft_n3_Qiskit">QFT-n3 Qiskit</Option>
                                                {/*<Option value="qiskit_grover_2q">Grover-n2 Qiskit</Option>*/}
                                            </Select>
                                        </Form.Item>


                                        <Form.Item label="View1 selection">
                                            <Button size={'small'} onClick={selection_clear}>Clear</Button>
                                        </Form.Item>



                                        {/*<Form.Item label="Form Layout"  >*/}
                                        {/*    <Radio.Group>*/}
                                        {/*        <Radio.Button value="horizontal">Horizontal</Radio.Button>*/}
                                        {/*        <Radio.Button value="vertical">Vertical</Radio.Button>*/}
                                        {/*        <Radio.Button value="inline">Inline</Radio.Button>*/}
                                        {/*    </Radio.Group>*/}
                                        {/*</Form.Item>*/}


                                        <Form.Item label="Dandelion point:" style={{width: '300px'}}>
                                            <Row>


                                                <Col>
                                                    <Slider
                                                        step={0.5}
                                                        min={0}
                                                        max={8}
                                                        style={{width: '100px'}}
                                                        defaultValue={8}
                                                        // min={this.state.view2_qual_extent[0]}
                                                        // max={this.state.view2_qual_extent[1]}
                                                        // onAfterChange={setTheta}
                                                        onChange={change_pointRadius}
                                                        // disabled={check1()}
                                                    />
                                                </Col>
                                                &nbsp;&nbsp;&nbsp;
                                                <Col>
                                                    <InputNumber
                                                        /*min={1}
                                                        max={20}*/
                                                        value={point_radius}
                                                        controls={false}                                                        onChange={change_theta}
                                                        onChange={change_pointRadius}
                                                        style={{width: '50px'}}
                                                    />
                                                </Col>

                                            </Row>

                                        </Form.Item>




                                        <Form.Item label="Dandelion circle:" style={{width: '300px'}}>
                                            <Row>


                                                <Col>
                                                    <Slider
                                                        step={0.01}
                                                        min={0}
                                                        max={1}
                                                        style={{width: '100px'}}
                                                        defaultValue={1}
                                                        // min={this.state.view2_qual_extent[0]}
                                                        // max={this.state.view2_qual_extent[1]}
                                                        // onAfterChange={setTheta}
                                                        onChange={change_theta}
                                                        // disabled={check1()}
                                                    />
                                                </Col>
                                                &nbsp;&nbsp;&nbsp;
                                                <Col>
                                                    <InputNumber
                                                        /*min={1}
                                                        max={20}*/
                                                        value={theta}
                                                        controls={false}                                                        onChange={change_theta}
                                                        onChange={change_theta}
                                                        style={{width: '50px'}}
                                                    />
                                                </Col>

                                            </Row>

                                        </Form.Item>


                                    </Space>


                                </Form>

                            </div>
                        </Col>
                    </Row>


                    {/* View 层*/}
                    <Row  gutter={0} justify="space-around" style={{height: "82%"}}>


                            <Col span={16}>

                                <Row gutter={30}  justify="center" style={{height: "72%", marginBottom: '20px'}}>
                                    <div className={'component'} style={{width: '95%', height: "100%"}}>

                                        <View
                                            param_algo={param_algo}
                                            change_statevector={change_statevector}
                                        ></View>

                                    </div>
                                </Row>


                                <Row gutter={30}  justify="center" style={{height: "20%"}}>
                                    <div className={'component'} style={{width: '95%', height: "60%"}}>

                                        <OriginCircuit
                                            param_algo={param_algo}
                                        ></OriginCircuit>

                                    </div>
                                </Row>

                            </Col>




                        <Col  className="gutter-row" span={8}>
                            <div className={'component dandelion_div'} style={{height: "85%"}}>

                                <Dandelion
                                    param_algo={param_algo}
                                    statevector={statevector}
                                    theta={theta}
                                    point_radius={point_radius}
                                ></Dandelion>

                            </div>
                        </Col>
                    </Row>

                </Content>
            </Layout>




            {/*    把 Legend 放这里*/}
            <Legend
                param_algo={param_algo}
            ></Legend>


        </ConfigProvider>





  );
}

export default App;
