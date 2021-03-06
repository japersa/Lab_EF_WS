<?php
/*
Template Name: Pagina Resultados en linea
*/
?>
<?php get_header(); ?>

<style>
    .form-signin {
        max-width: 330px;
        padding: 15px;
        margin: 0 auto;
    }
    
    .form-signin .form-signin-heading,
    .form-signin .checkbox {
        margin-bottom: 10px;
    }
    
    .form-signin .checkbox {
        font-weight: normal;
    }
    
    .form-signin .form-control {
        position: relative;
        height: auto;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        padding: 10px;
        font-size: 16px;
    }
    
    .form-signin .form-control:focus {
        z-index: 2;
    }
    
    .form-signin input[type="email"] {
        margin-bottom: -1px;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
    }
    
    .form-signin input[type="password"] {
        margin-bottom: 10px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }
    
    .recovery-success {
        margin-bottom: 0;
    }
    
    .table-results tr .on-hover {
        opacity: 0.5;
    }
    
    .table-results tr:hover .on-hover {
        opacity: 1;
    }
    
    .patients-list {
        max-height: 500px;
        overflow-y: auto;
    }
    
    #pdfModal .modal-body {
        min-height: 100px
    }
    
    #pdfModal .progress {
        position: absolute;
        top: 50%;
        left: 15px;
        right: 15px;
        display: none;
    }
    
    #pdfModal.loading .progress {
        display: block;
    }
    
    #pdfModal #pdf_viewer {
        width: 100%;
        height: 100%;
        display: block;
    }
    
    #pdfModal.loading #pdf_viewer,
    #pdfModal.error #pdf_viewer {
        display: none;
    }
    
    #pdfModal #pdf_viewer .no-object {
        position: relative;
        top: 50%;
        text-align: center;
    }
    
    #pdfModal .modal-body .alert-danger {
        display: none;
    }
    
    #pdfModal.error .modal-body .alert-danger {
        display: block;
    }
</style>

<div class="container single">
    <div id="content" class="clearfix">
        <div id="main" class="col-sm-12 clearfix" role="main">
            <?php if (have_posts()) :
                while (have_posts()) :
                    the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class('clearfix'); ?> role="article">
                    <header>
                        <div class="page-header">
                            <h1 class="single-title" itemprop="headline"><?php the_title(); ?></h1>
                        </div>  
                    </header><!-- end article header -->
                    <section class="row post_content">
                        <div class="col-xs-12" ng-app="EduferApp">
                            
                            <div class="modal fade" id="resetPassModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" ng-controller="Reset">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                            <h4 class="modal-title" id="myModalLabel">Recuperar contrase??a</h4>
                                        </div>
                                        <div class="modal-body" ng-hide="step != 1">
                                            <form ng-submit="onSendPin()">
                                                <legend>
                                                    Debe especificar el mismo correo que registr?? en el momento que se cre?? como paciente del laboratorio.
                                                </legend>

                                                <div ng-hide="!error" class="alert alert-danger" role="alert">
                                                    <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                                                    <span class="sr-only">Error:</span> {{error}}
                                                </div>
                                                <div class="input-group">
                                                    <span class="input-group-addon">Email</span>
                                                    <input type="text" class="form-control" placeholder="Email" required ng-model="pinForm.eMail" ng-disabled="!sendPinButton.enabled">

                                                    <span class="input-group-btn">
                                                        <button class="btn btn-primary" type="submit" ng-disabled="!sendPinButton.enabled">
                                                            <span class="glyphicon" ng-class="{'glyphicon-time' : sendPinButton.text == 'Cargando','glyphicon-send' : sendPinButton.text != 'Cargando'}"></span>
                                                    <span ng-bind="sendPinButton.text">Enviar nueva contrase??a</span>
                                                    </button>
                                                    </span>
                                                </div>
                                                <!-- /input-group -->
                                            </form>
                                        </div>
                                        <div ng-hide="step != 2">
                                            <div class="modal-body">
                                                <div class="alert alert-success recovery-success" role="alert">
                                                    <strong>Listo!</strong> <br> Hemos enviado una nueva contrase??a a tu correo electronico. <br>
                                                </div>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div class="modal fade" id="changePassModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel2" ng-controller="ChangePass">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                            <h4 class="modal-title" id="myModalLabel2">Cambiar contrase??a</h4>
                                        </div>
                                        <form ng-submit="onChangePass()" ng-hide="step != 1">
                                            <div class="modal-body">
                                                <legend>
                                                    Para cambiar su contrase??a, debe proporcionar tanto su contrase??a actual como la que desea establecer.
                                                </legend>

                                                <div ng-hide="!error" class="alert alert-danger" role="alert">
                                                    <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                                                    <span class="sr-only">Error:</span> {{error}}
                                                </div>
                                                <div ng-hide="changeForm.newPassword == changeForm.newPasswordConfirm" class="alert alert-danger" role="alert">
                                                    <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                                                    <span class="sr-only">Error:</span> Las contrase??as no coinciden
                                                </div>
                                                <div class="form-group">
                                                    <label>Contrase??a actual</label>
                                                    <input type="password" class="form-control" placeholder="Contrase??a actual" ng-model="changeForm.currentPassword" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Contrase??a nueva</label>
                                                    <input type="password" class="form-control" placeholder="Contrase??a nueva" ng-model="changeForm.newPassword" minlength="5" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Confirme su contrase??a nueva</label>
                                                    <input type="password" class="form-control" placeholder="Confirme su contrase??a nueva" ng-model="changeForm.newPasswordConfirm" minlength="5" required>
                                                </div>

                                            </div>
                                            <div class="modal-footer">
                                                <button class="btn btn-primary" ng-disabled="changeForm.newPassword != changeForm.newPasswordConfirm" ng-bind="changeForm.loading ? 'Espere...' : 'Cambiar'">Cambiar</button>
                                            </div>
                                        </form>
                                        <div ng-hide="step != 2">
                                            <div class="modal-body">
                                                <div class="alert alert-success recovery-success" role="alert">
                                                    <strong>Listo!</strong> <br> Su contrase??a se ha modificado exitosamente. <br>
                                                </div>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-default" ng-click="closeModal()">Cerrar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div id="signin-container" class="container" ng-controller="Login" ng-hide="logedIn">
                                <form class="form-signin" ng-submit="onLogin()">
                                    <h2 class="form-signin-heading">Iniciar sesi??n</h2>
                                    <label for="inputEmail" class="sr-only">Email</label>
                                    <input type="email" id="inputEmail" class="form-control" placeholder="Email" required autofocus ng-model="form.username">
                                    <label for="inputPassword" class="sr-only">Contrase??a</label>
                                    <input type="password" id="inputPassword" class="form-control" placeholder="Contrase??a" required ng-model=form.password>

                                    <div ng-hide="!error" class="alert alert-danger" role="alert">
                                        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                                        <span class="sr-only">Error:</span> {{error}}
                                    </div>

                                    <button class="btn btn-lg btn-block btn-primary" type="submit" ng-bind="loginButton.text" ng-disabled="!loginButton.enabled">Ingresar</button>

                                    <button class="btn btn-lg btn-block btn-link" type="button" data-toggle="modal" data-target="#resetPassModal">Recuperar contrase??a</button>
                                </form>
                            </div>


                            <div class="container" ng-controller="Main" ng-hide="!sessionData">


                                <div class="modal fade" id="pdfModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel3">
                                    <div class="modal-dialog modal-lg" role="document">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                                <h4 class="modal-title" id="myModalLabel3">Resultado</h4>
                                            </div>
                                            <div class="modal-body">
                                                <div class="progress">
                                                    <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 100%">
                                                        Por favor espere...
                                                    </div>
                                                </div>
                                                <object id="pdf_viewer" data="" type="application/pdf">
                                                    <div class="no-object">
                                                        <p class="bg-info" style="padding: 12px;">
                                                            Su resultado ya est?? listo
                                                            <a id="pdf_download" class="btn btn-primary" target="_blank"><i class="glyphicon glyphicon-cloud-download"></i> Descargar PDF</a>
                                                        </p>
                                                    </div>
                                                </object>
                                                <div class="alert alert-danger">
                                                    Lamentablemente este resultado no est?? disponibe para la descarga
                                                </div>
                                            </div>
                                            <div class="modal-footer">
                                                <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div class="user">
                                        <h3>Bienvenido <span ng-bind="sessionData.user.username"></span>!</h3>
                                        <hr />
                                    </div>

                                </div>
                                <div class="row">
                                    <div class="col-sm-3">

                                        <a class="btn btn-default btn-block" role="button" data-toggle="modal" data-target="#changePassModal">
                                            <span class="glyphicon glyphicon-lock"></span> Cambiar mi contrase??a
                                        </a>
                                        <h4>Pacientes</h4>
                                        <p>En su cuenta est??n relacionados los siguientes pacientes</p>
                                        <div class="list-group patients-list">
                                            <a href="#" class="list-group-item" ng-repeat="p in patients" ng-class="{'active' : currentPat == p}" ng-click="setCurrentPat(p)">
                                                <h4 class="list-group-item-heading" ng-bind="p.firstName + ' ' + p.lastName"></h4>
                                                <p class="list-group-item-text" ng-bind="p.identificationType + ' ' + p.identificationNumber"></p>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="col-sm-9" ng-hide="!currentPat">
                                        <h4>
                                            Resultados para {{currentPat.firstName + ' ' + currentPat.lastName}} (<span ng-bind="currentPat.identificationType + ' ' + currentPat.identificationNumber"></span>)
                                        </h4>
                                        <p class="bg-info" style="padding: 12px;">
                                            Por este medio solo podr?? consultar sus resultados cuando no hayan quedado muestras pendiente por tomar y est??n sus ex??menes totalmente procesados. <br/> Si necesita resultados parciales solic??telos.
                                        </p>
                                        <p>Este paciente presenta los siguientes resultados en nuestra base de datos</p>
                                        <p>Consulta realizada dentro de los ultimos <a href="#" ng-bind="query_moths" ng-click="setQueryParam()">#</a> meses</p>


                                        <table class="table table-responsive table-hover table-results">

                                            <thead>
                                                <tr>
                                                    <th>Numero</th>
                                                    <th>Descripci??n</th>
                                                    <th class="hidden-xs">Modulo</th>
                                                    <th class="hidden-xs">Estado</th>
                                                    <th>Fecha</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr ng-repeat="pr in currentPatResults">
                                                    <td ng-bind="pr.number"></td>
                                                    <td ng-bind="pr.description"></td>
                                                    <td class="hidden-xs" ng-bind="moduleMap[pr.module]"></td>
                                                    <td class="hidden-xs" ng-bind="stateMap[pr.state]"></td>
                                                    <td ng-bind="pr.date | date : 'dd/MMM/yyyy'"></td>
                                                    <td>
                                                        <a class="on-hover" ng-click="downloadResult(pr)" href="#"><span class="glyphicon glyphicon-cloud-download"></span> </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
                            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
                            <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>
							<script>
                                //var apibase = "http://152.204.131.66:8004/";
                                var apibase = "http://localhost:8004/";

								angular
									.module("EduferApp", [])
									.config(function($httpProvider) {

										$httpProvider.interceptors.push(function($q) {
											return {
												request: function(config) {
													if (sessionStorage.token)
														config.headers.Authorization = 'Bearer ' + sessionStorage.token;
													return config;
												},

												response: function(response) {
													return response;
												}
											};
										});
									})
									.controller("Login", function($scope, $rootScope, $http) {

										$scope.init = function() {
											$scope.loginButton = {
												text: "Ingresar",
												enabled: true
											}
											$scope.logedIn = false;
										}

										$scope.form = {
											username: "",
											password: ""
										};

										$scope.onLogin = function() {
											$scope.error = "";
											$scope.loginButton.text = "Cargando";
											$scope.loginButton.enabled = false;

											$http.post(apibase + "account/login", $scope.form).then(
												function(result) {
													$scope.logedIn = true;
													$rootScope.$broadcast('logedIn', result.data);
												},
												function(error) {
													$scope.init();
													var generic_error = "Es posible que el sistema no est?? disponible en el momento.";
													if (error.status < 0)
														$scope.error = "No se ha podido establecer comunicaci??n con el servidor. " + generic_error;
													else {
														var status_error = "Ha ocurrido un error inesperado (" + error.status + ")";
														$scope.error = error.data ? (error.data.message || status_error) : status_error;
													}
												}
											);
										}
										$scope.init();
									})
									.controller("Reset", function($scope, $http) {

										$scope.init = function() {
											$scope.resetForm = {
												eMail: "",
												password: "",
												PIN: ""
											}
											$scope.pinForm = {
												eMail: ""
											};

											$scope.sendPinButton = {
												text: "Enviar nueva contrase??a",
												enabled: true
											}
											$scope.resetButton = {
												text: "Reestablecer",
												enabled: true
											}
											$scope.step = 1;
										}

										$scope.onSendPin = function() {
											$scope.sendPinButton.text = "Cargando";
											$scope.sendPinButton.enabled = false;

											$http.post(apibase + "account/ResetPasswordRandom", $scope.pinForm).then(
												function(result) {
													$scope.step++;
												},
												function(error) {
													$scope.init();
													var generic_error = "Es posible que el sistema no est?? disponible en el momento.";
													if (error.status < 0)
														$scope.error = "No se ha podido establecer comunicaci??n con el servidor. " + generic_error;
													else {
														var status_error = "Ha ocurrido un error inesperado (" + error.status + ")";
														$scope.error = error.data ? (error.data.message || status_error) : status_error;
													}
												}
											);
										}

										$scope.init();
									})
									.controller("ChangePass", function($scope, $http) {

										$scope.init = function() {
											$scope.changeForm = {
												currentPassword: "",
												newPassword: "",
												newPasswordConfirm: "",
												loading: false
											}

											$scope.step = 1;
										}

										$scope.onChangePass = function() {
											$scope.changeForm.loading = false;
											//TODO: completa el formulario
											/*
											{
												"currentPassword": "contrase??a_actual",
												"newPassword": "contrase??a_nueva"
											}
											*/
											$http.post(apibase + "account/ChangePassword", $scope.changeForm).then(
												function(result) {
													$scope.init();
													$scope.step++;
												},
												function(error) {
													$scope.init();
													$scope.error = "Datos inv??lidos";
												}
											);
										}
										$scope.closeModal = function() {
											$('#changePassModal').modal('hide');
											$('.modal-backdrop').remove();
											$scope.init();
										}
										$scope.init();
									})
									.controller("Main", function($scope, $rootScope, $http) {
										$scope.patients = [];
										$scope.query_moths = 6;

										function getPatientQueryString(pat) {
											var current = new Date();
											var before6 = new Date();
											before6.setMonth(current.getMonth() - $scope.query_moths);

											var r = "?";
											r += "&identificationType=" + pat.identificationType;
											r += "&identificationNumber=" + pat.identificationNumber;
											r += "&from=" + before6.getTime();
											r += "&to=" + current.getTime();

											return r;
										}

										function getResultQueryString(res) {
											var parts = res.date.split("/");


											var dt = new Date(parts[2], parts[1] - 1, parts[0]);

											var r = "?";
											r += "&number=" + res.number;
											r += "&module=" + res.module;
											r += "&date=" + dt.getTime();

											return r;
										}

										$scope.setQueryParam = function() {
											$scope.query_moths = (prompt("Cantidad de meses a consultar", $scope.query_moths) || $scope.query_moths);
											$scope.loadResults();
										}

										$rootScope.$on('logedIn', function(event, sessionData) {
											sessionStorage.token = sessionData.token;
											$scope.sessionData = sessionData;

											$http.get(apibase + "patients").then(
												function(result) {
													$scope.patients = result.data;
													if ($scope.patients.length)
														$scope.setCurrentPat($scope.patients[0]);
												},
												function(errors) {
													//alert("Error");
													console.table(errors);
												}
											);
										});
										$scope.setCurrentPat = function(pat) {
											if (pat != $scope.currentPat) {
												$scope.currentPat = pat;

												$scope.loadResults();
											}
										}

										$scope.loadResults = function() {
											$scope.currentPatResults = [];

											$http.get(apibase + "results" + getPatientQueryString($scope.currentPat)).then(
												function(result) {
													$scope.currentPatResults = result.data;
												},
												function(errors) {
													//alert("Error");
													console.table(errors);
												}
											);
										}

										$scope.stateMap = {
											"T": "Totalmente validado",
											"P": "Parcialmente validado",
											"N": "No validado"
										}
										$scope.moduleMap = {
											"LAB": "Laboratorio",
											"PAT": "Patolog??a"
										}

										$scope.downloadResult = function(rst) {
											if (rst.loading) return;
											rst.loading = true;

											$('#pdfModal').addClass('loading');
											$('#pdfModal').removeClass('error');
											$('#pdfModal').modal('show');

											function toBinaryString(data) {
												var ret = [];
												var len = data.length;
												var byte;
												for (var i = 0; i < len; i++) {
													byte = (data.charCodeAt(i) & 0xFF) >>> 0;
													ret.push(String.fromCharCode(byte));
												}

												return ret.join('');
											}
											$http.get(apibase + "results/pdf" + getResultQueryString(rst)).then(
												function(result) {
													rst.loading = false;

													var total_height = $(window).height();
													var body_height = total_height - 182;

													$('#pdf_viewer').height(body_height);
													$('#pdfModal').removeClass('loading');
													document.getElementById("pdf_viewer").setAttribute('data', apibase + result.data.url);
													document.getElementById("pdf_download").setAttribute('href', apibase + result.data.url);
												},
												function(errors) {
													rst.loading = false;
													$('#pdfModal').addClass('error');
													$('#pdfModal').removeClass('loading');
													console.table(errors);
												}
											);

										}
									});
							</script>
                        </div>
                    </section><!-- end article section --> 
                </article> <!-- end article -->
            <?php                                                                                                                                                                                                                                                                                                                                                                                                                                 endwhile; ?>
            <?php else : ?>
                <article id="post-not-found">
                    <header>
                        <h1><?php _e("Not Found", "lcef-nativapps"); ?></h1>
                    </header>
                    <section class="post_content">
                        <p><?php _e("Sorry, but the requested resource was not found on this site.", "lcef-nativapps"); ?></p>
                    </section>
                    <footer>
                    </footer>
                </article>
            <?php endif; ?>
        </div> <!-- end #main -->
    </div> <!-- end #content -->
</div><!-- end #container -->
<?php get_footer(); ?>
